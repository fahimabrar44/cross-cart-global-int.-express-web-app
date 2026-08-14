import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT || "587"),
  secure: false, // Use TLS
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const escapeHtml = (value: unknown): string =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

export interface ShipmentEmailPayload {
  to: string;
  toName: string;
  trackId: string;
  awb?: string;
  orderId?: string;
  currentStatus?: string;
  estimatedDelivery?: string;
  senderName?: string;
  senderPhone?: string;
  senderCity?: string;
  receiverName?: string;
  receiverPhone?: string;
  receiverCity?: string;
  weight?: string;
  serviceType?: string;
  priority?: string;
  items?: { name?: string; quantity?: number; totalPrice?: number }[];
  trackingUrl?: string;
}

// Shipment Update Email (full parcel details, sent to sender + receiver)
export async function sendShipmentUpdateEmail(payload: ShipmentEmailPayload) {
  const formatStatus = (s?: string) =>
    (s || "")
      .split("-")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");

  const itemRows = (payload.items || [])
    .map(
      (it) => `
        <tr>
          <td style="padding:8px 12px;border:1px solid #e5e7eb;">${escapeHtml(it.name)}</td>
          <td style="padding:8px 12px;border:1px solid #e5e7eb;text-align:center;">${escapeHtml(it.quantity)}</td>
          <td style="padding:8px 12px;border:1px solid #e5e7eb;text-align:right;">${escapeHtml(it.totalPrice)}</td>
        </tr>`
    )
    .join("");

  const mailOptions = {
    from: `"CrossCart Global Int Express" <${process.env.EMAIL_USER}>`,
    to: payload.to,
    subject: `Shipment Update: ${payload.trackId} - ${formatStatus(
      payload.currentStatus
    )}`,
    text: `Shipment Update for ${payload.trackId}
Status: ${formatStatus(payload.currentStatus)}
Track online: ${payload.trackingUrl || ""}`,
    html: `
      <div style="font-family: Arial, sans-serif; background-color:#f4f4f7; padding:20px;">
        <div style="max-width:600px; margin:0 auto; background-color:#fff; border-radius:8px; overflow:hidden;">
          <div style="background-color:#006B45; text-align:center; padding:20px;">
            <h2 style="color:#fff; margin:0;">CrossCart Global Int Express</h2>
          </div>
          <div style="padding:20px;">
            <p>Dear ${escapeHtml(payload.toName || "Customer")},</p>
            <p>Here is the latest update for your shipment:</p>

            <div style="background-color:#e8f5ef; border:1px solid #006B45; border-radius:6px; padding:14px; margin:16px 0;">
              <strong style="color:#006B45;">Status: ${formatStatus(payload.currentStatus)}</strong>
            </div>

            <h3 style="color:#12352A; border-bottom:2px solid #F5C400; padding-bottom:6px;">Tracking Information</h3>
            <table style="width:100%; border-collapse:collapse; font-size:14px;">
              <tr>
                <td style="padding:6px 0; color:#6b7280;">Tracking Number</td>
                <td style="padding:6px 0; font-weight:bold;">${escapeHtml(payload.trackId)}</td>
              </tr>
              ${payload.awb ? `<tr><td style="padding:6px 0; color:#6b7280;">AWB Number</td><td style="padding:6px 0; font-weight:bold;">${escapeHtml(payload.awb)}</td></tr>` : ""}
              ${payload.estimatedDelivery ? `<tr><td style="padding:6px 0; color:#6b7280;">Estimated Delivery</td><td style="padding:6px 0; font-weight:bold;">${escapeHtml(payload.estimatedDelivery)}</td></tr>` : ""}
              ${payload.weight ? `<tr><td style="padding:6px 0; color:#6b7280;">Weight</td><td style="padding:6px 0; font-weight:bold;">${escapeHtml(payload.weight)}</td></tr>` : ""}
              ${payload.serviceType ? `<tr><td style="padding:6px 0; color:#6b7280;">Service Type</td><td style="padding:6px 0; font-weight:bold;">${escapeHtml(payload.serviceType)}</td></tr>` : ""}
              ${payload.priority ? `<tr><td style="padding:6px 0; color:#6b7280;">Priority</td><td style="padding:6px 0; font-weight:bold;">${escapeHtml(payload.priority)}</td></tr>` : ""}
            </table>

            <h3 style="color:#12352A; border-bottom:2px solid #F5C400; padding-bottom:6px;">Sender & Receiver</h3>
            <table style="width:100%; border-collapse:collapse; font-size:14px;">
              <tr>
                <td style="padding:6px 0; color:#6b7280;">Sender</td>
                <td style="padding:6px 0; font-weight:bold;">${escapeHtml(payload.senderName || "N/A")}${payload.senderPhone ? `<br/><span style="font-weight:normal; color:#6b7280;">${escapeHtml(payload.senderPhone)}</span>` : ""}${payload.senderCity ? `<br/><span style="font-weight:normal; color:#6b7280;">${escapeHtml(payload.senderCity)}</span>` : ""}</td>
              </tr>
              <tr>
                <td style="padding:6px 0; color:#6b7280;">Receiver</td>
                <td style="padding:6px 0; font-weight:bold;">${escapeHtml(payload.receiverName || "N/A")}${payload.receiverPhone ? `<br/><span style="font-weight:normal; color:#6b7280;">${escapeHtml(payload.receiverPhone)}</span>` : ""}${payload.receiverCity ? `<br/><span style="font-weight:normal; color:#6b7280;">${escapeHtml(payload.receiverCity)}</span>` : ""}</td>
              </tr>
            </table>

            ${
              (payload.items || []).length > 0
                ? `
              <h3 style="color:#12352A; border-bottom:2px solid #F5C400; padding-bottom:6px;">Parcel Items</h3>
              <table style="width:100%; border-collapse:collapse; font-size:14px;">
                <thead>
                  <tr style="background-color:#12352A; color:#fff;">
                    <th style="padding:8px 12px; text-align:left;">Item</th>
                    <th style="padding:8px 12px; text-align:center;">Qty</th>
                    <th style="padding:8px 12px; text-align:right;">Price</th>
                  </tr>
                </thead>
                <tbody>${itemRows}</tbody>
              </table>`
                : ""
            }

            <div style="text-align:center; margin:24px 0;">
              <a href="${escapeHtml(payload.trackingUrl || "#")}" style="display:inline-block; padding:12px 28px; background-color:#F5C400; color:#12352A; text-decoration:none; border-radius:5px; font-weight:bold;">Track Your Shipment Online</a>
            </div>

            <p style="font-size:12px; color:#6b7280;">This is an automated message from CrossCart Global Int Express. Please do not reply to this email.</p>
          </div>
          <div style="padding:10px 20px; font-size:12px; color:#777; text-align:center;">
            &copy; ${new Date().getFullYear()} CrossCart Global Int Express International Courier. All rights reserved.
          </div>
        </div>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
}

// Verification Email
export async function sendVerificationEmail(email: string, code: string) {
  const verificationUrl = `${process.env.PUBLIC_APP_URL}/auth/email-verify?code=${code}`;

  const mailOptions = {
    from: `"CrossCart Global Int Express" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Verify Your CrossCart Global Int Express Account",
    text: `Your verification code is: ${code}\n\nThis code will expire in 15 minutes.`,
    html: `
      <div style="font-family: Arial, sans-serif; background-color:#f4f4f7; padding:20px;">
        <div style="max-width:600px; margin:0 auto; background-color:#fff; border-radius:8px; overflow:hidden;">
          <div style="background-color:#0d6efd; text-align:center; padding:20px;">
            <img src="${process.env.PUBLIC_APP_URL}/logo.png" alt="CrossCart Logo" style="width:150px;" />
          </div>
          <div style="padding:20px;">
            <h2 style="color:#0d6efd;">Verify Your Email</h2>
            <p>Your verification code is: <strong>${code}</strong></p>
            <p>This code will expire in 15 minutes.</p>
            <a href="${verificationUrl}" style="display:inline-block; padding:12px 24px; margin-top:20px; background-color:#0d6efd; color:#fff; text-decoration:none; border-radius:5px; font-weight:bold;">Verify Account</a>
          </div>
          <div style="padding:10px 20px; font-size:12px; color:#777; text-align:center;">
            &copy; ${new Date().getFullYear()} CrossCart Global Int Express International Courier. All rights reserved.
          </div>
        </div>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
}

// Login Alert Email
export async function sendLoginAlertEmail(email: string, name: string) {
  const mailOptions = {
    from: `"CrossCart Global Int Express Security" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Login Alert",
    text: `Hi ${name},\n\nA new login was detected for your account.\n\nIf this wasn't you, please contact support immediately.\n\nBest regards,\nCrossCart Global Int Express Team`,
    html: `
      <div style="font-family: Arial, sans-serif; background-color:#f4f4f7; padding:20px;">
        <div style="max-width:600px; margin:0 auto; background-color:#fff; border-radius:8px; overflow:hidden;">
          <div style="background-color:#0d6efd; text-align:center; padding:20px;">
            <img src="${process.env.PUBLIC_APP_URL}/logo.png" alt="CrossCart Logo" style="width:150px;" />
          </div>
          <div style="padding:20px;">
            <h2 style="color:#0d6efd;">Login Alert</h2>
            <p>Hi ${name},</p>
            <p>A new login was detected for your account.</p>
            <p>If this wasn't you, please contact support immediately.</p>
            <br />
            <p>Best regards,<br />CrossCart Global Int Express Team</p>
          </div>
          <div style="padding:10px 20px; font-size:12px; color:#777; text-align:center;">
            &copy; ${new Date().getFullYear()} CrossCart Global Int Express International Courier. All rights reserved.
          </div>
        </div>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
}