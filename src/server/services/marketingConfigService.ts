import connectDB from "@/config/db";
import {
  MarketingConfig,
  IMarketingConfig,
} from "@/server/models/MarketingConfig.model";

export interface PublicMarketingConfig {
  metaPixelId: string;
  tiktokPixelId: string;
  linkedinPartnerId: string;
  pinterestTagId: string;
  twitterPixelId: string;
  googleAdsSendTo: string;
}

let cache: { data: IMarketingConfig | null; at: number } | null = null;
const TTL_MS = 5 * 60 * 1000;

export async function getMarketingConfig(): Promise<IMarketingConfig | null> {
  if (cache && Date.now() - cache.at < TTL_MS) return cache.data;
  await connectDB();
  const doc = (await MarketingConfig.findOne({}).lean()) as
    | IMarketingConfig
    | null;
  cache = { data: doc, at: Date.now() };
  return doc;
}

export function clearMarketingConfigCache(): void {
  cache = null;
}

export async function getPublicMarketingConfig(): Promise<PublicMarketingConfig> {
  const doc = await getMarketingConfig();
  return {
    metaPixelId: doc?.metaPixelId || "",
    tiktokPixelId: doc?.tiktokPixelId || "",
    linkedinPartnerId: doc?.linkedinPartnerId || "",
    pinterestTagId: doc?.pinterestTagId || "",
    twitterPixelId: doc?.twitterPixelId || "",
    googleAdsSendTo: doc?.googleAdsSendTo || "",
  };
}

export async function updateMarketingConfig(
  data: Partial<IMarketingConfig>,
  updatedBy?: string
): Promise<IMarketingConfig> {
  await connectDB();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const update: Record<string, unknown> = { ...(data as any) };
  if (updatedBy) update.updatedBy = updatedBy;
  const doc = await MarketingConfig.findOneAndUpdate(
    {},
    { $set: update },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );
  clearMarketingConfigCache();
  return doc as IMarketingConfig;
}
