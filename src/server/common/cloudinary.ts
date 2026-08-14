import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export interface CloudinaryUploadResult {
  url: string;
  publicId: string;
}

function assertConfigured(): void {
  const { cloud_name, api_key, api_secret } = cloudinary.config();
  const missing: string[] = [];
  if (!cloud_name) missing.push("CLOUDINARY_CLOUD_NAME");
  if (!api_key) missing.push("CLOUDINARY_API_KEY");
  if (!api_secret) missing.push("CLOUDINARY_API_SECRET");
  if (missing.length > 0) {
    throw new Error(
      `Cloudinary is not configured. Set ${missing.join(
        ", "
      )} environment variables.`
    );
  }
}

export async function uploadBase64ToCloudinary(
  dataUrl: string,
  folder: string
): Promise<CloudinaryUploadResult> {
  assertConfigured();

  const result = await cloudinary.uploader.upload(dataUrl, {
    folder,
    resource_type: "auto",
  });

  return { url: result.secure_url, publicId: result.public_id };
}

export async function deleteCloudinaryAsset(publicId: string): Promise<void> {
  if (!publicId) return;
  await cloudinary.uploader.destroy(publicId);
}