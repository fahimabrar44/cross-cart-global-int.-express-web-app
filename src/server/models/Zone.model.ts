import { Document, Schema, model, models, Types } from "mongoose";

// Interface
export interface IZone extends Document {
  name: string; // e.g., "EUROPE (D)"
  code?: string; // Optional short code, e.g., "D"
  countryIds: Types.ObjectId[]; // Countries grouped under this zone
  description?: string;
  isActive: boolean; // Enable/disable zone
  deactivatedAt?: Date; // If zone is deactivated
  deactivatedReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Schema
const zoneSchema = new Schema<IZone>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    code: {
      type: String,
      default: null,
      trim: true,
      uppercase: true,
    },
    countryIds: {
      type: [Schema.Types.ObjectId],
      ref: "Country",
      default: [],
    },
    description: {
      type: String,
      default: null,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    deactivatedAt: {
      type: Date,
      default: null,
    },
    deactivatedReason: {
      type: String,
      default: null,
      trim: true,
    },
  },
  { timestamps: true }
);

// Index for fast lookup
zoneSchema.index({ isActive: 1 });
zoneSchema.index({ countryIds: 1 });

// Export model
export const Zone = models.Zone || model<IZone>("Zone", zoneSchema);
