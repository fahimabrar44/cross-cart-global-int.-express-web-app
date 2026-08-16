import mongoose from "mongoose";
import { models } from "mongoose";
import { Document, Schema, model } from "mongoose";

export interface IJob extends Document {
  title: string;
  slug: string;
  department: string;
  location: string;
  type: "Full-time" | "Part-time" | "Contract" | "Internship";
  description: string;
  responsibilities: string[];
  requirements: string[];
  isActive: boolean;
  applicationEmail?: string;
  createdAt: Date;
  updatedAt: Date;
}

const jobSchema = new Schema<IJob>(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, trim: true, unique: true },
    department: { type: String, default: "General" },
    location: { type: String, default: "Dhaka, Bangladesh" },
    type: {
      type: String,
      enum: ["Full-time", "Part-time", "Contract", "Internship"],
      default: "Full-time",
    },
    description: { type: String, default: "" },
    responsibilities: { type: [String], default: [] },
    requirements: { type: [String], default: [] },
    isActive: { type: Boolean, default: true },
    applicationEmail: { type: String, default: "" },
  },
  { timestamps: true }
);

// Auto-generate a unique slug from the title.
jobSchema.pre("validate", async function (next) {
  if (!this.isModified("title")) return next();

  const base =
    this.title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-") || "job";

  let candidate = base;
  let suffix = 2;
  while (true) {
    const existing = await (
      this.constructor as typeof mongoose.Model
    ).findOne({ slug: candidate, _id: { $ne: this._id } });
    if (!existing) break;
    candidate = `${base}-${suffix}`;
    suffix += 1;
  }

  this.slug = candidate;
  next();
});

export const Job = models.Job || model<IJob>("Job", jobSchema);
