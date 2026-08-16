import { Document, Schema, model, models } from "mongoose";

const counterSchema = new Schema({
  name: { type: String, required: true, unique: true },
  seq: { type: Number, default: 0 },
});

const Counter = models.Counter || model("Counter", counterSchema);

// Address Sub-schema
const addressSchema = new Schema({
  address: { type: String, default: "" },
  city: { type: String, default: "" },
  zipCode: { type: String, default: "" },
  country: { type: Schema.Types.ObjectId, ref: "Country", default: null },
});

// User Info Sub-schema (sender / receiver)
const userInfoSchema = new Schema({
  name: { type: String, default: "" },
  phone: { type: String, default: "" },
  email: { type: String, default: "" },
  address: { type: addressSchema, default: () => ({}) },
});

// Product Sub-schema (single product)
const listSchema = new Schema({
  name: { type: String, required: true, default: "" },
  quantity: { type: Number, required: true, default: 1 },
  unitPrice: { type: Number, required: true, default: 0 },
  totalPrice: { type: Number, required: true, default: 0 },
});

// Box Sub-schema (each box with dimensions + fragile)
const boxSchema = new Schema({
  length: { type: Number, default: 0 },
  width: { type: Number, default: 0 },
  height: { type: Number, default: 0 },
  fragile: { type: Boolean, default: false },
});

// Parcel Sub-schema
const parcelSchema = new Schema({
  from: { type: Schema.Types.ObjectId, ref: "Country", default: null },
  to: { type: Schema.Types.ObjectId, ref: "Country", default: null },
  sender: { type: userInfoSchema, default: () => ({}) },
  receiver: { type: userInfoSchema, default: () => ({}) },
  box: { type: [boxSchema], default: [] },
  weight: { type: String, required: true },
  packagingType: { type: String, default: "" },
  boxCount: { type: Number, default: 0 },
  dimensions: {
    length: { type: Number, default: 0 },
    width: { type: Number, default: 0 },
    height: { type: Number, default: 0 },
  },
  serviceType: { type: String, default: "" },
  priority: {
    type: String,
    enum: ["normal", "express", "super-express", "tax-paid"],
    default: "normal",
  },
  orderType: {
    type: String,
    enum: ["document", "parcel", "e-commerce"],
    default: "parcel",
  },
  item: { type: [listSchema], default: () => [] },
  customerNote: { type: String, default: "" },
  insurance: {
    enabled: { type: Boolean, default: false },
    declaredValue: { type: Number, default: 0 },
    charge: { type: Number, default: 0 },
  },
  couponCode: { type: String, trim: true, default: "" },
  couponDiscount: { type: Number, default: 0 },
});

// Payment Sub-schema
const paymentSchema = new Schema({
  pType: { type: String, required: true, default: "" },
  pAmount: { type: Number, required: true, default: 0 },
  pOfferDiscount: { type: Number, required: true, default: 0 },
  pExtraCharge: { type: Number, required: true, default: 0 },
  pDiscount: { type: Number, required: true, default: 0 },
  pReceived: { type: Number, required: true, default: 0 },
  pRefunded: { type: Number, required: true, default: 0 },
});

// Handover Sub-schema
const handoverSchema = new Schema({
  company: { type: String, default: "" },
  tracking: { type: String, default: "" },
  payment: { type: Number, default: 0 },
  courier_code: { type: String, default: "" }, // detected/matched TrackingMore courier code
});

// Delivery assignment sub-schema
const assignmentSchema = new Schema({
  rider: { type: Schema.Types.ObjectId, ref: "Rider", default: null },
  assignedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
  assignedAt: { type: Date, default: null },
});

// Main Order Interface
export interface IOrder extends Document {
  parcel: typeof parcelSchema;
  orderDate: Date;
  payment: typeof paymentSchema;
  trackId: string;
  awb?: string;
  handover_by: typeof handoverSchema;
  assignment: typeof assignmentSchema;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

// Main Order Schema
const orderSchema = new Schema<IOrder>(
  {
    parcel: { type: parcelSchema, required: true },
    orderDate: { type: Date, default: Date.now, required: true },

    payment: { type: paymentSchema, required: true },
    trackId: {
      type: String,
      unique: true,
      required: true,
    },
    awb: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
      default: "",
    },
    handover_by: { type: handoverSchema, required: true, default: () => ({}) },
    assignment: { type: assignmentSchema, default: () => ({}) },
    status: {
      type: String,
      enum: [
        "pending",
        "confirmed",
        "picked-up",
        "in-transit",
        "out-for-delivery",
        "delivered",
        "cancelled",
        "returned",
      ],
      default: "pending",
    },
  },
  { timestamps: true }
);

orderSchema.pre("save", async function (next) {
  if (!this.trackId) {
    try {
      const counter = await Counter.findOneAndUpdate(
        { name: "order" },
        { $inc: { seq: 1 } },
        { new: true, upsert: true }
      );

      // Example Format: CCG000001
      this.trackId = `CCG${counter.seq.toString().padStart(8, "0")}`;
    } catch (err) {
      return next(err as Error); // ✅ use Error type instead of any
    }
  }

  // Auto-generate AWB (IATA style: 3-digit airline prefix + 8-digit serial)
  if (!this.awb) {
    try {
      const awbCounter = await Counter.findOneAndUpdate(
        { name: "awb" },
        { $inc: { seq: 1 } },
        { new: true, upsert: true }
      );
      const prefix = process.env.AWB_PREFIX || "132";
      this.awb = `${prefix}-${awbCounter.seq.toString().padStart(8, "0")}`;
    } catch (err) {
      return next(err as Error);
    }
  }
  next();
});

// Export Order Model
export const Order = models.Order || model<IOrder>("Order", orderSchema);
