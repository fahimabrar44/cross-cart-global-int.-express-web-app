import { Document, Schema, Types, model, models } from "mongoose";

export interface ICoupon extends Document {
  code: string;
  description: string;
  discountType: "percentage" | "fixed";
  discountValue: number;
  minOrderAmount: number;
  maxDiscount: number;
  usageLimit: number;
  usedCount: number;
  perUserLimit: number;
  usedBy: Types.ObjectId[];
  validFrom: Date;
  validUntil: Date;
  isActive: boolean;
  appliesTo: "all" | "first-order" | "specific";
  createdAt: Date;
  updatedAt: Date;
}

const couponSchema = new Schema<ICoupon>(
  {
    code: { type: String, required: true, trim: true, uppercase: true, unique: true },
    description: { type: String, default: "" },
    discountType: {
      type: String,
      enum: ["percentage", "fixed"],
      required: true,
    },
    discountValue: { type: Number, required: true, min: 0 },
    minOrderAmount: { type: Number, default: 0 },
    maxDiscount: { type: Number, default: 0 },
    usageLimit: { type: Number, default: 0 },
    usedCount: { type: Number, default: 0 },
    perUserLimit: { type: Number, default: 1 },
    usedBy: { type: [Schema.Types.ObjectId], ref: "User", default: [] },
    validFrom: { type: Date, default: Date.now },
    validUntil: { type: Date, required: true },
    isActive: { type: Boolean, default: true },
    appliesTo: {
      type: String,
      enum: ["all", "first-order", "specific"],
      default: "all",
    },
  },
  { timestamps: true }
);

couponSchema.index({ code: 1 }, { unique: true });
couponSchema.index({ validUntil: 1, isActive: 1 });
couponSchema.index({ appliesTo: 1 });

export const Coupon = models.Coupon || model<ICoupon>("Coupon", couponSchema);