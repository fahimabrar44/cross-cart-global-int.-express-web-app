import { Document, Schema, model, models } from "mongoose";

/**
 * Reusable item/product catalog.
 *
 * Orders copy the item name and price at creation time, so editing or
 * deleting a catalog entry never changes historical orders. The catalog only
 * exists to speed up data entry and keep names consistent.
 */
export interface IItem extends Document {
  name: string;
  /** Lower-cased, trimmed name used for case-insensitive uniqueness. */
  nameKey: string;
  defaultPrice: number;
  unit: string;
  description?: string | null;
  isActive: boolean;
  deactivatedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const itemSchema = new Schema<IItem>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    nameKey: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    defaultPrice: {
      type: Number,
      default: 0,
      min: 0,
    },
    unit: {
      type: String,
      default: "pcs",
      trim: true,
      maxlength: 20,
    },
    description: {
      type: String,
      default: null,
      trim: true,
      maxlength: 500,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    deactivatedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

itemSchema.index({ name: 1 });

export const Item = models.Item || model<IItem>("Item", itemSchema);
