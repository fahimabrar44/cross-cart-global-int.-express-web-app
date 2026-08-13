import { Document, Schema, Types, model, models } from "mongoose";

const coverageZoneSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    area: { type: String, trim: true, default: "" },
    isCovered: { type: Boolean, default: true },
    deliveryCharge: { type: Number, default: 0 },
    estimatedDays: { type: String, default: "" },
  },
  { _id: true }
);

export interface IBranch extends Document {
  name: string;
  code: string;
  type: "head" | "branch" | "hub";
  address: string;
  city: string;
  phone: string;
  manager?: string;
  managerPhone?: string;
  openingHours: string;
  isActive: boolean;
  coverage: typeof coverageZoneSchema[];
  createdAt: Date;
  updatedAt: Date;
}

const branchSchema = new Schema<IBranch>(
  {
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, trim: true, unique: true },
    type: {
      type: String,
      enum: ["head", "branch", "hub"],
      default: "branch",
    },
    address: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    manager: { type: String, trim: true, default: "" },
    managerPhone: { type: String, trim: true, default: "" },
    openingHours: { type: String, default: "9:00 AM - 6:00 PM" },
    isActive: { type: Boolean, default: true },
    coverage: { type: [coverageZoneSchema], default: [] },
  },
  { timestamps: true }
);

branchSchema.index({ city: 1, isActive: 1 });
branchSchema.index({ code: 1 }, { unique: true });

export const Branch = models.Branch || model<IBranch>("Branch", branchSchema);