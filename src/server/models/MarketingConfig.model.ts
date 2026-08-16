import mongoose from "mongoose";
import { models } from "mongoose";
import { Schema, model, Document } from "mongoose";

export interface IMarketingConfig extends Document {
  metaPixelId: string;
  metaCapiToken: string;
  tiktokPixelId: string;
  linkedinPartnerId: string;
  pinterestTagId: string;
  twitterPixelId: string;
  googleAdsSendTo: string;
  updatedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

const MarketingConfigSchema = new Schema<IMarketingConfig>(
  {
    metaPixelId: { type: String, default: "" },
    metaCapiToken: { type: String, default: "" },
    tiktokPixelId: { type: String, default: "" },
    linkedinPartnerId: { type: String, default: "" },
    pinterestTagId: { type: String, default: "" },
    twitterPixelId: { type: String, default: "" },
    googleAdsSendTo: { type: String, default: "" },
    updatedBy: { type: String },
  },
  { timestamps: true }
);

export const MarketingConfig =
  models.MarketingConfig ||
  model<IMarketingConfig>("MarketingConfig", MarketingConfigSchema);
