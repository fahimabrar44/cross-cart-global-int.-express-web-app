import { Document, Schema, model, models, Types } from "mongoose";

export interface IJobApplication extends Document {
  job: Types.ObjectId;
  jobTitle: string;
  name: string;
  email: string;
  phone: string;
  resumeUrl?: string;
  coverLetter?: string;
  coverLetterUrl?: string;
  status: "new" | "reviewed" | "rejected" | "hired";
  createdAt: Date;
  updatedAt: Date;
}

const jobApplicationSchema = new Schema<IJobApplication>(
  {
    job: { type: Schema.Types.ObjectId, ref: "Job", required: true },
    jobTitle: { type: String, default: "" },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    resumeUrl: { type: String, default: "" },
    coverLetter: { type: String, default: "" },
    status: {
      type: String,
      enum: ["new", "reviewed", "rejected", "hired"],
      default: "new",
    },
  },
  { timestamps: true }
);

jobApplicationSchema.index({ job: 1, createdAt: -1 });
jobApplicationSchema.index({ status: 1 });

export const JobApplication =
  models.JobApplication ||
  model<IJobApplication>("JobApplication", jobApplicationSchema);
