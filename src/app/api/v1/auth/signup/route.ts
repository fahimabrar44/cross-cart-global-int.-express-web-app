import connectDB from "@/config/db";
import { createRateLimitedHandler } from "@/server/common/apiWrapper";
import { errorResponse, successResponse } from "@/server/common/response";
import { User } from "@/server/models/User.model";
import { Referral } from "@/server/models/Referral.model";
import { emailService } from "@/services/emailService";
import { notificationService } from "@/services/notificationService";
import { getClientIp } from "@/server/common/requestIp";
import { consumeRateLimit } from "@/server/services/rateLimitService";

interface SignupBody {
  name: string;
  phone: string;
  email: string;
  password: string;
  agreeToTerms?: boolean;
  referralCode?: string;
}

// Max 3 signup attempts per IP per hour (shared via Redis when configured).
const SIGNUP_RATE_LIMIT = 3;
const RATE_LIMIT_WINDOW = 60 * 60 * 1000;

function validateEmail(email: string): boolean {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email) && email.length <= 254;
}

function validatePhone(phone: string): boolean {
  const phoneRegex = /^\+?[1-9]\d{7,14}$/;
  return phoneRegex.test(phone);
}

function validatePassword(password: string): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (password.length < 8)
    errors.push("Password must be at least 8 characters long");
  if (password.length > 128)
    errors.push("Password must not exceed 128 characters");
  if (!/(?=.*[a-z])/.test(password))
    errors.push("Password must contain at least one lowercase letter");
  if (!/(?=.*[A-Z])/.test(password))
    errors.push("Password must contain at least one uppercase letter");
  if (!/(?=.*\d)/.test(password))
    errors.push("Password must contain at least one number");
  if (!/(?=.*[@$!%*?&])/.test(password))
    errors.push(
      "Password must contain at least one special character (@$!%*?&)"
    );

  const commonPasswords = ["password", "12345678", "qwerty123", "admin123"];
  if (commonPasswords.some((p) => password.toLowerCase().includes(p)))
    errors.push("Password is too common, please choose a stronger password");

  return { isValid: errors.length === 0, errors };
}

function validateName(name: string): boolean {
  const nameRegex = /^[a-zA-Z\s\-.']{2,50}$/;
  return nameRegex.test(name.trim());
}

function sanitizeInput(input: string): string {
  return input.trim().replace(/[<>]/g, "");
}

export const POST = createRateLimitedHandler(
  async ({ req }) => {
    const ipAddress = getClientIp(req);

    try {
      await connectDB();

      const signupLimit = await consumeRateLimit(
        `signup:${ipAddress}`,
        SIGNUP_RATE_LIMIT,
        RATE_LIMIT_WINDOW
      );

      if (!signupLimit.allowed) {
        const response = errorResponse({
          status: 429,
          message: "Too many signup attempts. Please try again later.",
          req,
        });
        response.headers.set(
          "Retry-After",
          String(
            Math.max(1, Math.ceil((signupLimit.resetAt - Date.now()) / 1000))
          )
        );
        return response;
      }

      const body = (await req.json()) as SignupBody;

      let { name, phone, email } = body;
      const { password, agreeToTerms } = body;
      const referralCode = String(body.referralCode || "").trim().toUpperCase();

      if (!name || !phone || !email || !password) {
        return errorResponse({
          status: 400,
          message: "Name, phone, email, and password are required",
          req,
        });
      }

      if (!agreeToTerms) {
        return errorResponse({
          status: 400,
          message: "You must agree to the terms and conditions",
          req,
        });
      }

      // Sanitize
      name = sanitizeInput(name);
      email = sanitizeInput(email.toLowerCase());
      phone = sanitizeInput(phone);

      if (!validateName(name)) {
        return errorResponse({
          status: 400,
          message:
            "Name must be 2-50 characters and contain only letters, spaces, hyphens, periods, and apostrophes",
          req,
        });
      }

      if (!validateEmail(email)) {
        return errorResponse({
          status: 400,
          message: "Please provide a valid email address",
          req,
        });
      }

      if (!validatePhone(phone)) {
        return errorResponse({
          status: 400,
          message:
            "Please provide a valid phone number in international format",
          req,
        });
      }

      const passwordValidation = validatePassword(password);
      if (!passwordValidation.isValid) {
        return errorResponse({
          status: 400,
          message: "Password requirements not met",
          error: passwordValidation.errors,
          req,
        });
      }

      const existingUser = await User.findOne({
        $or: [{ email }, { phone }],
      }).select("email phone isActive");

      if (existingUser) {
        return errorResponse({
          status: 409,
          message: "An account with this email or phone number already exists",
          req,
        });
      }

      const newUser = new User({
        name,
        phone,
        email,
        password, // hashed in pre-save middleware
        role: "user",
        isActive: true,
        isVerified: false,
        createdAt: new Date(),
        registrationIP: ipAddress,
      });

      const verificationCode = newUser.generateVerificationCode();

      // Persist the user, retrying on a referral-code (E11000) collision.
      // The pre-save hook regenerates referralCode on each attempt (isNew
      // stays true until the insert succeeds).
      let saved = false;
      for (let attempt = 0; attempt < 5; attempt++) {
        try {
          await newUser.save();
          saved = true;
          break;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (saveErr: any) {
          if (saveErr?.code === 11000) continue;
          throw saveErr;
        }
      }
      if (!saved) {
        throw new Error("Could not create account (referral code conflict). Please try again.");
      }

      // Optional referral code: link new user to referrer
      if (referralCode) {
        const referrer = await User.findOne({
          referralCode,
          isActive: true,
        }).select("_id phone");
        if (referrer) {
          newUser.referredBy = referralCode;
          const referredUserRef = newUser._id;
          const referral = new Referral({
            referrer: referrer._id,
            referralCode,
            referredUser: referredUserRef,
            referredPhone: newUser.phone,
            status: "pending",
          });
          await Promise.all([newUser.save(), referral.save()]);
        }
      }

      // Send email & notification — awaited so serverless doesn't drop it
      try {
        await emailService.sendVerificationEmail({
          email: newUser.email,
          name: newUser.name,
          code: verificationCode,
        });
      } catch (err) {
        console.error("Email send error:", err);
      }

      notificationService
        .sendAuthNotification(
          { phone: newUser.phone, email: newUser.email, name: newUser.name },
          "welcome"
        )
        .catch((err) => console.error("Notification send error:", err));

      const responseData = {
        user: {
          id: newUser._id,
          name: newUser.name,
          email: newUser.email,
          phone: newUser.phone,
          isVerified: newUser.isVerified,
          role: newUser.role,
        },
        message: "Account created successfully",
        nextStep: "Please check your email for verification instructions",
        verificationRequired: true,
      };

      return successResponse({
        status: 201,
        message: "Signup successful! Please verify your email address.",
        data: responseData,
        req,
      });
    } catch (error: unknown) {
      console.error("Signup API Error:", error);

      const msg =
        error instanceof Error ? error.message : "An error occurred during registration";
      return errorResponse({
        status: 500,
        message: `Registration failed: ${msg}`,
        error,
        req,
      });
    }
  },
  { max: 5, windowMs: 60000 } // 5 requests per minute per IP
);
