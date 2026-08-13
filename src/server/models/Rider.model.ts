import { Document, Schema, Types, model, models } from "mongoose";

export interface IRider extends Document {
  name: string;
  phone: string;
  email?: string;
  nidNumber?: string;
  vehicleType: "bike" | "cycle" | "van" | "car" | "walking";
  vehiclePlate?: string;
  status: "available" | "on-delivery" | "offline" | "blocked";
  branch?: Types.ObjectId;
  zones: string[];
  userId?: Types.ObjectId;
  joiningDate: Date;
  rating: number;
  totalDeliveries: number;
  createdAt: Date;
  updatedAt: Date;
}

const riderSchema = new Schema<IRider>(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true, unique: true },
    email: { type: String, trim: true, lowercase: true, default: "" },
    nidNumber: { type: String, trim: true, default: "" },
    vehicleType: {
      type: String,
      enum: ["bike", "cycle", "van", "car", "walking"],
      default: "bike",
    },
    vehiclePlate: { type: String, trim: true, default: "" },
    status: {
      type: String,
      enum: ["available", "on-delivery", "offline", "blocked"],
      default: "available",
    },
    branch: { type: Schema.Types.ObjectId, ref: "Branch", default: null },
    zones: { type: [String], default: [] },
    userId: { type: Schema.Types.ObjectId, ref: "User", default: null },
    joiningDate: { type: Date, default: Date.now },
    rating: { type: Number, min: 0, max: 5, default: 0 },
    totalDeliveries: { type: Number, default: 0 },
  },
  { timestamps: true }
);

riderSchema.index({ status: 1, branch: 1 });
riderSchema.index({ zones: 1 });

export const Rider = models.Rider || model<IRider>("Rider", riderSchema);