import mongoose, { Schema, Document } from "mongoose";

export interface ITrackingEvent extends Document {
  visitorId: string;
  userId?: string;
  type: string;
  path: string;
  title?: string;
  referrer?: string;
  userAgent?: string;
  payload?: Record<string, unknown>;
  createdAt: Date;
}

const TrackingEventSchema = new Schema<ITrackingEvent>(
  {
    visitorId: { type: String, required: true, index: true },
    userId: { type: String, index: true },
    type: { type: String, required: true, index: true },
    path: { type: String, required: true },
    title: { type: String },
    referrer: { type: String },
    userAgent: { type: String },
    payload: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

export const TrackingEvent =
  mongoose.models.TrackingEvent ||
  mongoose.model<ITrackingEvent>("TrackingEvent", TrackingEventSchema);
