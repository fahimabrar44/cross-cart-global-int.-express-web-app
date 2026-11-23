/**
 * Fail fast on missing critical configuration instead of discovering it at
 * runtime (for example, when the first order request hits an undefined DB URI).
 */

const REQUIRED = ["MONGODB_URI", "JWT_SECRET"] as const;

const RECOMMENDED = [
  "REFRESH_TOKEN_SECRET",
  "PUBLIC_APP_URL",
  "CLOUDINARY_CLOUD_NAME",
  "CLOUDINARY_API_KEY",
  "CLOUDINARY_API_SECRET",
  "EMAIL_HOST",
  "EMAIL_PORT",
  "EMAIL_USER",
  "EMAIL_PASS",
] as const;

let validated = false;

export function validateEnv(): void {
  if (validated) return;
  validated = true;

  const missing = REQUIRED.filter((key) => !process.env[key]?.trim());

  if (missing.length > 0) {
    const message = `Missing required environment variables: ${missing.join(", ")}`;
    if (process.env.NODE_ENV === "production") {
      throw new Error(`${message}. See .env.example.`);
    }
    console.warn(`[env] ${message}`);
  }

  if (
    process.env.JWT_SECRET &&
    process.env.JWT_SECRET.trim().length < 32
  ) {
    console.warn(
      "[env] JWT_SECRET is shorter than 32 characters. Use a long random value in production."
    );
  }

  if (
    process.env.REFRESH_TOKEN_SECRET &&
    process.env.REFRESH_TOKEN_SECRET === process.env.JWT_SECRET
  ) {
    console.warn(
      "[env] REFRESH_TOKEN_SECRET should be different from JWT_SECRET."
    );
  }

  const missingRecommended = RECOMMENDED.filter(
    (key) => !process.env[key]?.trim()
  );
  if (missingRecommended.length > 0) {
    console.warn(
      `[env] Optional integrations are not configured: ${missingRecommended.join(
        ", "
      )}`
    );
  }
}
