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

export async function uploadBase64ToCloudinary(
  dataUrl: string,
  folder: string
): Promise<CloudinaryUploadResult> {
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