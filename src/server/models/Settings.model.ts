import { Document, Schema, Types, model, models } from "mongoose";

export interface ISetting extends Document {
  key: string;
  value: string | number | boolean;
  description?: string;
  isSecret?: boolean;
  updatedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const settingSchema = new Schema<ISetting>(
  {
    key: {
      type: String,
      required: [true, "Setting key is required"],
      unique: true,
      trim: true,
      index: true,
    },
    value: {
      type: Schema.Types.Mixed,
      required: [true, "Setting value is required"],
    },
    description: { type: String, default: "" },
    isSecret: { type: Boolean, default: false },
    updatedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true }
);

export const Setting = models.Setting || model<ISetting>("Setting", settingSchema);