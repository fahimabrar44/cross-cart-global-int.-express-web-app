import mongoose, { Schema, Document } from "mongoose";

export interface ILead extends Document {
  name: string;
  phone: string;
  email: string;
  serviceType: string;
  submittedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const LeadSchema = new Schema<ILead>(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true },
    serviceType: { type: String, required: true, trim: true },
    submittedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export const Lead =
  mongoose.models.Lead || mongoose.model<ILead>("Lead", LeadSchema);
