import { Document, Schema, Model, model, models } from "mongoose";

// Logs every carrier-sync attempt (manual, cron, webhook, public-page poll)
// so admins can inspect why a tracking number failed to sync.
export interface ITrackSyncLog extends Document {
  trackId: string; // local CCGxxxx id
  trackingNumber: string; // courier tracking number
  courier?: string; // courier code / company
  source: "cron" | "webhook" | "manual" | "public";
  status: "success" | "failed";
  message?: string;
  added?: number; // number of new events merged
  runAt: Date;
  createdAt: Date;
}

const trackSyncLogSchema = new Schema<ITrackSyncLog>(
  {
    trackId: { type: String, default: "" },
    trackingNumber: { type: String, default: "" },
    courier: { type: String, default: "" },
    source: {
      type: String,
      enum: ["cron", "webhook", "manual", "public"],
      default: "manual",
    },
    status: {
      type: String,
      enum: ["success", "failed"],
      default: "failed",
    },
    message: { type: String, default: "" },
    added: { type: Number, default: 0 },
    runAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

trackSyncLogSchema.index({ runAt: -1 });
trackSyncLogSchema.index({ status: 1 });
trackSyncLogSchema.index({ trackingNumber: 1 });

// Keep the log bounded — prune old entries on write. (closure resolves the
// model at save-time, safe because the export below is initialized first at
// runtime before any document is saved)
trackSyncLogSchema.pre("save", async function (next) {
  try {
    const CurrentModel = models.TrackSyncLog as Model<ITrackSyncLog> | undefined;
    if (!CurrentModel) return next();
    const count = await CurrentModel.countDocuments();
    if (count >= 2000) {
      const oldest = await CurrentModel.findOne()
        .sort({ runAt: 1 })
        .select("_id");
      if (oldest) await CurrentModel.deleteOne({ _id: oldest._id });
    }
  } catch {
    // pruning must never block the log write
  }
  next();
});

// Export TrackSyncLog Model
export const TrackSyncLog =
  models.TrackSyncLog ||
  model<ITrackSyncLog>("TrackSyncLog", trackSyncLogSchema);
