import connectDB from "@/config/db";
import { Job } from "@/server/models/Job.model";
import { JobApplication } from "@/server/models/JobApplication.model";
import { successResponse, errorResponse } from "@/server/common/response";
import { uploadBase64ToCloudinary } from "@/server/common/cloudinary";
import { sendMetaCapiEvent } from "@/server/lib/metaCapi";
import { NextRequest } from "next/server";
import { Types } from "mongoose";

const ALLOWED_RESUME_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "image/png",
  "image/jpeg",
  "image/jpg",
];

const MAX_BASE64_LENGTH = 8_000_000; // ~6MB file after base64 overhead

function parseDataUrl(dataUrl: string): { mime: string; base64: string } | null {
  const match = /^data:([^;]+);base64,(.+)$/.exec(dataUrl);
  if (!match) return null;
  return { mime: match[1].toLowerCase(), base64: match[2] };
}

async function uploadIfPresent(
  dataUrl: string | undefined,
  folder: string
): Promise<string | undefined> {
  if (!dataUrl) return undefined;
  const parsed = parseDataUrl(dataUrl);
  if (!parsed) {
    throw new Error("Invalid file upload (expected base64 data URL)");
  }
  if (!ALLOWED_RESUME_TYPES.includes(parsed.mime)) {
    throw new Error("Unsupported file type. Use PDF, DOC, DOCX, PNG or JPG.");
  }
  if (parsed.base64.length > MAX_BASE64_LENGTH) {
    throw new Error("File is too large. Maximum size is 6MB.");
  }
  const result = await uploadBase64ToCloudinary(dataUrl, folder);
  return result.url;
}

// POST /api/v1/jobs/[id]/apply - submit a job application (public)
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;
    if (!Types.ObjectId.isValid(id)) {
      return errorResponse({ status: 400, message: "Invalid job id", req });
    }

    const job = await Job.findById(id).lean();
    if (!job) {
      return errorResponse({ status: 404, message: "Job not found", req });
    }

    const body = await req.json().catch(() => ({}));
    const name = String(body.name || "").trim();
    const email = String(body.email || "").trim();
    const phone = String(body.phone || "").trim();
    const location = String(body.location || "").trim();
    const portfolioUrl = String(body.portfolioUrl || "").trim();
    const linkedinUrl = String(body.linkedinUrl || "").trim();
    const coverLetter = String(body.coverLetter || "").trim();

    if (!name || !email || !phone) {
      return errorResponse({
        status: 400,
        message: "Name, email and phone are required",
        req,
      });
    }
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      return errorResponse({
        status: 400,
        message: "Please provide a valid email address",
        req,
      });
    }

    let resumeUrl: string | undefined;
    let coverLetterUrl: string | undefined;
    try {
      resumeUrl = await uploadIfPresent(body.resume, "zypco/resumes");
      coverLetterUrl = await uploadIfPresent(
        body.coverLetterFile,
        "zypco/resumes"
      );
    } catch (uploadError) {
      const msg =
        uploadError instanceof Error
          ? uploadError.message
          : "File upload failed";
      return errorResponse({ status: 400, message: msg, req });
    }

    const application = new JobApplication({
      job: new Types.ObjectId(id),
      jobTitle: (job as { title?: string }).title || "",
      name,
      email,
      phone,
      location,
      portfolioUrl,
      linkedinUrl,
      resumeUrl,
      coverLetter,
      coverLetterUrl,
      status: "new",
    });
    await application.save();

    void sendMetaCapiEvent(
      "CompleteRegistration",
      { email, phone },
      { req, customData: { jobTitle: (job as { title?: string }).title || "" } }
    );

    return successResponse({
      status: 201,
      message: "Application submitted successfully",
      data: { _id: application._id },
      req,
    });
  } catch (error: unknown) {
    const msg =
      error instanceof Error ? error.message : "Failed to submit application";
    return errorResponse({ status: 500, message: msg, error, req });
  }
}
