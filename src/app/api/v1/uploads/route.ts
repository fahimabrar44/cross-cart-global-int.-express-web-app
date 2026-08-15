import { errorResponse, successResponse } from "@/server/common/response";
import { uploadBase64ToCloudinary } from "@/server/common/cloudinary";
import { createModeratorHandler } from "@/server/common/apiWrapper";

interface UploadBody {
  dataUrl?: string;
  dataUrls?: string[];
  folder?: string;
}

function isBase64DataUrl(value: string): boolean {
  return /^data:image\/(jpeg|png|jpg|webp|gif);base64,[A-Za-z0-9+/=]+$/.test(
    value
  );
}

// POST /api/v1/uploads - moderator/admin upload image(s) to Cloudinary.
// Accepts a single `dataUrl` (returns { url }) or an array `dataUrls`
// (returns { urls }).
export const POST = createModeratorHandler(async ({ req }) => {
  try {
    const body: UploadBody = await req.json().catch(() => ({}));

    const folder = body.folder || "zypco/blog";

    if (Array.isArray(body.dataUrls)) {
      if (body.dataUrls.length === 0) {
        return errorResponse({
          status: 400,
          message: "dataUrls must not be empty",
          req,
        });
      }
      for (const dataUrl of body.dataUrls) {
        if (typeof dataUrl !== "string" || !isBase64DataUrl(dataUrl)) {
          return errorResponse({
            status: 400,
            message: "Each item in dataUrls must be a valid base64 image data URL",
            req,
          });
        }
      }

      const urls: string[] = [];
      for (const dataUrl of body.dataUrls) {
        const { url } = await uploadBase64ToCloudinary(dataUrl, folder);
        urls.push(url);
      }

      return successResponse({
        status: 200,
        message: "Files uploaded successfully",
        data: { urls },
        req,
      });
    }

    if (
      !body.dataUrl ||
      typeof body.dataUrl !== "string" ||
      !isBase64DataUrl(body.dataUrl)
    ) {
      return errorResponse({
        status: 400,
        message: "dataUrl must be a valid base64 image data URL",
        req,
      });
    }

    const { url } = await uploadBase64ToCloudinary(body.dataUrl, folder);

    return successResponse({
      status: 200,
      message: "File uploaded successfully",
      data: { url },
      req,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Upload failed";
    return errorResponse({ status: 500, message: msg, error, req });
  }
});
