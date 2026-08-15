import fs from "fs";
import nodemailer from "nodemailer";
import path from "path";

interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

interface TransactionalEmailData {
  to: string;
  subject: string;
  template: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: Record<string, any>;
}

export class EmailService {
  private transporter: nodemailer.Transporter;
  private templates: Map<string, EmailTemplate> = new Map();

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || "smtp.gmail.com",
      port: Number(process.env.EMAIL_PORT) || 587,
      secure: Number(process.env.EMAIL_PORT) === 465,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    this.loadEmailTemplates();
  }

  /**
   * Load email templates from file system (synchronous so templates are
   * guaranteed ready before the first email is sent).
   */
  private loadEmailTemplates(): void {
    try {
      const templatesPath = path.join(process.cwd(), "src/templates/email");

      // Base template
      const baseHtml = this.loadTemplate(templatesPath, "base.html") || this.fallbackHtml();
      const baseText = this.loadTemplate(templatesPath, "base.txt") || this.fallbackText();

      const templateNames = [
        "welcome",
        "verification",
        "password-reset",
        "order-confirmation",
        "order-update",
        "notification",
        "security-alert",
      ];

      for (const name of templateNames) {
        const html = this.loadTemplate(templatesPath, `${name}.html`) || baseHtml;
        const text = this.loadTemplate(templatesPath, `${name}.txt`) || baseText;

        const subject = `CrossCart Global Int Express - ${name.replace("-", " ").replace(/\b\w/g, (l) => l.toUpperCase())}`;

        this.templates.set(name, { subject, html, text });
      }

      // Always set base as fallback
      this.templates.set("base", { subject: "Cross Cart Global International Express Notification", html: baseHtml, text: baseText });
    } catch (err) {
      console.error("Failed to load email templates:", err);
    }
  }

  private loadTemplate(basePath: string, fileName: string): string | null {
    try {
      const filePath = path.join(basePath, fileName);
      return fs.readFileSync(filePath, "utf-8");
    } catch {
      return null;
    }
  }

  
private fallbackHtml(): string {
  return `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <style>
      body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color:#12352A; margin:0; padding:0; }
      .container { max-width:600px; margin:40px auto; background:#F5C400; border-radius:12px; overflow:hidden; box-shadow:0 8px 25px rgba(0,0,0,0.2); }
      .header { background:#12352A; text-align:center; padding:25px; }
      .header img { width:160px; max-width:80%; }
      .content { padding:30px; color:#12352A; line-height:1.7; }
      .content h2 { color:#12352A; font-size:24px; margin-bottom:20px; }
      .content p { font-size:16px; margin-bottom:20px; }
      .button { display:inline-block; padding:14px 28px; margin-top:10px; background:#12352A; color:#F5C400 !important; text-decoration:none; font-weight:bold; border-radius:8px; transition: 0.3s; }
      .button:hover { opacity:0.9; }
      .footer { background:#12352A; text-align:center; font-size:13px; color:#F5C400; padding:20px; border-top:1px solid #F5C400; }
      a { color:#F5C400; text-decoration:none; }
    </style>
  </head>
  <body>
    <div class="container">
      <!-- Header -->
      <div class="header">
        <img src="{{logoUrl}}" alt="Cross Cart Logo" />
      </div>

      <!-- Content -->
      <div class="content">
        <h2>{{title}}</h2>
        <p>{{message}}</p>
        {{#actionUrl}}
        <a href="{{actionUrl}}" class="button">{{actionText}}</a>
        {{/actionUrl}}
      </div>

      <!-- Footer -->
      <div class="footer">
        &copy; ${new Date().getFullYear()} Cross Cart Global International Express International Courier. All rights reserved.<br/>
        24/7 Support: <a href="mailto:support@crosscartbd.com">support@crosscartbd.com</a>
      </div>
    </div>
  </body>
  </html>
  `;
}

private fallbackText(): string {
  return `
{{title}}
{{message}}
{{#actionUrl}}{{actionText}}: {{actionUrl}}{{/actionUrl}}
`;
}



/**
 * Render template with simple mustache syntax
 */

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
private renderTemplate(template: string | null, data: Record<string, any>): string {
  if (!template) return "";

  let rendered = template;

  const publicUrl = (p: string) =>
    `${(process.env.PUBLIC_APP_URL || "").replace(/\/+$/, "")}${p}`;

  // Ensure logo is included dynamically
    if (!data.logoUrl) {
      data.logoUrl = publicUrl("/full-logo.png");
    }
  if (!data.year) {
    data.year = String(new Date().getFullYear());
  }

  // Replace variables {{variable}}
  Object.entries(data).forEach(([key, value]) => {
    const regex = new RegExp(`\\{\\{${key}\\}\\}`, "g");
    rendered = rendered.replace(regex, String(value ?? ""));
  });

  // Handle conditional blocks {{#variable}} ... {{/variable}}
  Object.entries(data).forEach(([key, value]) => {
    const blockRegex = new RegExp(`\\{\\{#${key}\\}\\}([\\s\\S]*?)\\{\\{\\/${key}\\}\\}`, "g");
    rendered = value ? rendered.replace(blockRegex, "$1") : rendered.replace(blockRegex, "");
  });

  // Strip any leftover placeholder blocks/tags from data that wasn't provided
  rendered = rendered.replace(/\{\{#[\w.]+[\s\S]*?\{\{\/[\w.]+\}\}\}/g, "");
  rendered = rendered.replace(/\{\{[\w.]+\}\}/g, "");

  return rendered;
}

/**
 * Send transactional email
 */
async sendTransactionalEmail(data: TransactionalEmailData): Promise<boolean> {
  try {
    const template = this.templates.get(data.template) || this.templates.get("base")!;

    // Inline the logo as a CID attachment so it renders even when email
    // clients block remote images (falls back to public URL).
    const cid = "crosscart-logo";
    const logoPath = path.join(process.cwd(), "public/full-logo.png");
    let logoAttachment: { filename: string; path: string; cid: string } | null = null;
    if (fs.existsSync(logoPath)) {
      logoAttachment = { filename: "logo.png", path: logoPath, cid };
      data.data.logoUrl = `cid:${cid}`;
    }

    const html = this.renderTemplate(template.html, data.data);
    const text = this.renderTemplate(template.text, data.data);

    await this.transporter.sendMail({
      from: `"Cross Cart Global International Express Courier" <${process.env.EMAIL_USER}>`,
      to: data.to,
      subject: data.subject || template.subject,
      html,
      text,
      attachments: logoAttachment ? [logoAttachment] : [],
    });

    return true;
  } catch (err) {
    console.error("Failed to send transactional email:", err);
    return false;
  }
}

/**
 * Send verification email
 */
async sendVerificationEmail(userData: { email: string; name: string; code: string }): Promise<boolean> {
  const base = (process.env.PUBLIC_APP_URL || "").replace(/\/+$/, "");
  const verificationUrl = `${base}/auth/email-verify?email=${userData.email}&code=${userData.code}`;
  return this.sendTransactionalEmail({
    to: userData.email,
    subject: "Verify Your Cross Cart Global International Express Account",
    template: "verification",
    data: {
      name: userData.name,
      title: "Verify Your Email Address",
      message: `Please verify your email by clicking the button below or using this code: ${userData.code}`,
      actionUrl: verificationUrl,
      actionText: "Verify Account",
      verificationCode: userData.code,
    },
  });
}

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(userData: {
    email: string;
    name: string;
    resetUrl: string;
  }): Promise<boolean> {
    return this.sendTransactionalEmail({
      to: userData.email,
      subject: "Reset Your Cross Cart Global International Express Password",
      template: "password-reset",
      data: {
        name: userData.name,
        title: "Reset Your Password",
        message: `Hi ${userData.name}, we received a request to reset your password. Click the button below to choose a new password.`,
        actionUrl: userData.resetUrl,
        actionText: "Reset Password",
      },
    });
  }

  /**
   * Send password-changed confirmation email
   */
  async sendPasswordChangedEmail(userData: {
    email: string;
    name: string;
  }): Promise<boolean> {
    return this.sendTransactionalEmail({
      to: userData.email,
      subject: "Your Cross Cart Global International Express Password Was Changed",
      template: "notification",
      data: {
        name: userData.name,
        title: "Password Changed Successfully",
        message: `Hi ${userData.name}, your account password was just changed. If this wasn't you, please reset your password immediately or contact our support team.`,
      },
    });
  }

  /**
   * Send welcome email
   */
async sendWelcomeEmail(userData: { email: string; name: string; verificationCode?: string }): Promise<boolean> {
  const base = (process.env.PUBLIC_APP_URL || "").replace(/\/+$/, "");
  const verificationUrl = userData.verificationCode
    ? `${base}/auth/verify?code=${userData.verificationCode}`
    : `${base}/dashboard`;

  return this.sendTransactionalEmail({
    to: userData.email,
    subject: "Welcome to Cross Cart Global International Express International Courier!",
    template: "welcome",
    data: {
      name: userData.name,
      title: `Welcome to Cross Cart Global International Express, ${userData.name}!`,
      message:
        "Thank you for joining Cross Cart Global International Express International Courier. Your account is ready to start shipping worldwide.",
      actionUrl: verificationUrl,
      actionText: userData.verificationCode ? "Verify Your Account" : "Get Started",
      verificationCode: userData.verificationCode,
    },
  });
}

  /**
   * Test email configuration
   */
  async testEmailConfig(): Promise<boolean> {
    try {
      await this.transporter.verify();
      return true;
    } catch (err) {
      console.error("Email configuration test failed:", err);
      return false;
    }
  }
}

export const emailService = new EmailService();