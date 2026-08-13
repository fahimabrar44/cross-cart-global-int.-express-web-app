import { Document, Schema, Types, model, models } from "mongoose";

export interface IReferral extends Document {
  referrer: Types.ObjectId;
  referralCode: string;
  referredUser?: Types.ObjectId;
  referredPhone?: string;
  status: "pending" | "rewarded" | "expired";
  rewardAmount: number;
  rewardPaid: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const referralSchema = new Schema<IReferral>(
  {
    referrer: { type: Schema.Types.ObjectId, ref: "User", required: true },
    referralCode: { type: String, required: true, index: true },
    referredUser: { type: Schema.Types.ObjectId, ref: "User", default: null },
    referredPhone: { type: String, trim: true, default: "" },
    status: {
      type: String,
      enum: ["pending", "rewarded", "expired"],
      default: "pending",
    },
    rewardAmount: { type: Number, default: 0 },
    rewardPaid: { type: Boolean, default: false },
  },
  { timestamps: true }
);

referralSchema.index({ referrer: 1, referralCode: 1 });

export const Referral = models.Referral || model<IReferral>("Referral", referralSchema);