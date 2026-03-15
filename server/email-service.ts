import nodemailer from "nodemailer";
import fs from "fs";
import path from "path";

// ---------------------------------------------------------------------------
// SMTP configuration — set env vars for real delivery; defaults to console log
// ---------------------------------------------------------------------------
const SMTP_HOST = process.env.SMTP_HOST || "";
const SMTP_PORT = parseInt(process.env.SMTP_PORT || "587", 10);
const SMTP_USER = process.env.SMTP_USER || "";
const SMTP_PASS = process.env.SMTP_PASS || "";
const FROM_EMAIL = process.env.FROM_EMAIL || SMTP_USER || "support@bhseointelligence.com";
const FROM_NAME = process.env.FROM_NAME || "BH SEO Intelligence";
const ADMIN_EMAIL = "support@bhseointelligence.com";

const smtpConfigured = !!(SMTP_HOST && SMTP_USER && SMTP_PASS);

function getTransport() {
  if (smtpConfigured) {
    return nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_PORT === 465,
      auth: { user: SMTP_USER, pass: SMTP_PASS },
    });
  }
  // Dev / MVP fallback — logs to console, writes to /tmp/
  return null;
}

// ---------------------------------------------------------------------------
// Helper: persist email to /tmp/ for dev inspection
// ---------------------------------------------------------------------------
function saveEmailToFile(to: string, subject: string, html: string) {
  const ts = new Date().toISOString().replace(/[:.]/g, "-");
  const safeTo = to.replace(/[^a-zA-Z0-9]/g, "_");
  const filename = `email_${safeTo}_${ts}.html`;
  const filePath = path.join("/tmp", filename);
  const header = `<!--\n  To: ${to}\n  Subject: ${subject}\n  Date: ${new Date().toISOString()}\n-->\n`;
  fs.writeFileSync(filePath, header + html, "utf-8");
  return filePath;
}

// ---------------------------------------------------------------------------
// Generic send helper
// ---------------------------------------------------------------------------
async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  const transport = getTransport();

  if (transport) {
    await transport.sendMail({
      from: `"${FROM_NAME}" <${FROM_EMAIL}>`,
      to,
      subject,
      html,
    });
    console.log(`[email] Sent to ${to}: "${subject}"`);
  } else {
    // MVP fallback — console log + file
    const filePath = saveEmailToFile(to, subject, html);
    console.log(`[email-dev] Would send to ${to}: "${subject}"`);
    console.log(`[email-dev] Saved to ${filePath}`);
  }
}

// ---------------------------------------------------------------------------
// 1. Send report to customer
// ---------------------------------------------------------------------------
export async function sendReportToCustomer(
  email: string,
  centerName: string,
  reportType: "summary" | "full",
  reportHtml: string,
): Promise<void> {
  const tierLabel = reportType === "full" ? "Comprehensive SEO Audit" : "SEO Summary Report";
  const subject = `Your ${tierLabel} for ${centerName} — BH SEO Intelligence`;

  const wrapper = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"/></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:32px 0;">
    <tr><td align="center">
      <table width="640" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;">
        <!-- Header -->
        <tr><td style="background:linear-gradient(135deg,#0f766e,#1e3a5f);padding:28px 32px;">
          <h1 style="margin:0;color:#ffffff;font-size:22px;">BH SEO Intelligence</h1>
        </td></tr>
        <!-- Body -->
        <tr><td style="padding:32px;">
          <p style="font-size:16px;color:#1e293b;margin:0 0 16px;">Hello,</p>
          <p style="font-size:16px;color:#1e293b;margin:0 0 16px;">
            Your <strong>${tierLabel}</strong> for <strong>${escHtml(centerName)}</strong> is ready!
          </p>
          <p style="font-size:16px;color:#1e293b;margin:0 0 24px;">
            ${reportType === "summary"
              ? "This summary highlights key findings. Upgrade to the full Comprehensive Audit to unlock all strategic recommendations and detailed analysis."
              : "Your comprehensive audit includes detailed analysis across technical SEO, keywords, content, local SEO, competitors, and admissions impact."
            }
          </p>
          <p style="font-size:14px;color:#64748b;margin:0 0 16px;">Your full report is attached below.</p>
        </td></tr>
        <!-- Footer -->
        <tr><td style="background:#f8fafc;padding:20px 32px;border-top:1px solid #e2e8f0;">
          <p style="font-size:13px;color:#94a3b8;margin:0;">
            &copy; ${new Date().getFullYear()} BH SEO Intelligence &mdash; Behavioral Health Marketing Analytics
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  const transport = getTransport();

  if (transport) {
    await transport.sendMail({
      from: `"${FROM_NAME}" <${FROM_EMAIL}>`,
      to: email,
      subject,
      html: wrapper,
      attachments: [
        {
          filename: `${centerName.replace(/[^a-zA-Z0-9 ]/g, "")}-SEO-Report.html`,
          content: reportHtml,
          contentType: "text/html",
        },
      ],
    });
    console.log(`[email] Report sent to ${email} (${reportType})`);
  } else {
    // MVP fallback
    const filePath = saveEmailToFile(email, subject, wrapper);
    const reportPath = saveEmailToFile(email, `REPORT-${subject}`, reportHtml);
    console.log(`[email-dev] Would send report to ${email} (${reportType})`);
    console.log(`[email-dev] Email body saved to ${filePath}`);
    console.log(`[email-dev] Report HTML saved to ${reportPath}`);
  }
}

// ---------------------------------------------------------------------------
// 2. Notify admin of purchase
// ---------------------------------------------------------------------------
export async function notifyAdminOfPurchase(
  customerEmail: string,
  centerName: string,
  reportType: "summary" | "full",
  amount: number,
): Promise<void> {
  const tierLabel = reportType === "full" ? "Comprehensive Audit ($1,997)" : "Summary Report ($197)";
  const subject = `💰 New Purchase: ${tierLabel} — ${centerName}`;

  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"/></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:32px 0;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;">
        <tr><td style="background:#0f766e;padding:20px 24px;">
          <h1 style="margin:0;color:#fff;font-size:18px;">New Purchase Notification</h1>
        </td></tr>
        <tr><td style="padding:24px;">
          <table width="100%" cellpadding="8" cellspacing="0" style="font-size:15px;color:#1e293b;">
            <tr><td style="font-weight:600;width:140px;">Customer</td><td>${escHtml(customerEmail)}</td></tr>
            <tr><td style="font-weight:600;">Center</td><td>${escHtml(centerName)}</td></tr>
            <tr><td style="font-weight:600;">Product</td><td>${tierLabel}</td></tr>
            <tr><td style="font-weight:600;">Amount</td><td>$${(amount / 100).toLocaleString("en-US", { minimumFractionDigits: 2 })}</td></tr>
            <tr><td style="font-weight:600;">Time</td><td>${new Date().toISOString()}</td></tr>
          </table>
          <p style="margin:20px 0 0;font-size:14px;color:#64748b;">
            The report is being generated and will be emailed to the customer automatically.
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  await sendEmail(ADMIN_EMAIL, subject, html);
}

// ---------------------------------------------------------------------------
// 3. Send free score results to lead
// ---------------------------------------------------------------------------
export async function sendFreeScoreEmail(
  email: string,
  centerName: string,
  score: number,
  websiteUrl: string,
): Promise<void> {
  const scoreColor = score >= 80 ? "#16a34a" : score >= 60 ? "#ca8a04" : "#dc2626";
  const scoreLabel = score >= 80 ? "Strong" : score >= 60 ? "Needs Improvement" : "Needs Attention";
  const subject = `Your Free SEO Score: ${score}/100 — ${centerName || websiteUrl}`;

  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"/></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:32px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;">
        <!-- Header -->
        <tr><td style="background:linear-gradient(135deg,#0f766e,#1e3a5f);padding:24px 32px;">
          <h1 style="margin:0;color:#ffffff;font-size:20px;">BH SEO Intelligence</h1>
        </td></tr>
        <!-- Score -->
        <tr><td style="padding:32px;text-align:center;">
          <p style="font-size:14px;color:#64748b;margin:0 0 8px;">Your SEO Health Score</p>
          <p style="font-size:48px;font-weight:800;color:${scoreColor};margin:0;line-height:1.1;">${score}<span style="font-size:20px;color:#94a3b8;">/100</span></p>
          <p style="font-size:13px;color:${scoreColor};margin:8px 0 0;font-weight:600;">${scoreLabel}</p>
          <p style="font-size:13px;color:#94a3b8;margin:8px 0 24px;">${escHtml(websiteUrl)}</p>
          <div style="border-top:1px solid #e2e8f0;padding-top:24px;">
            <p style="font-size:15px;color:#1e293b;margin:0 0 12px;font-weight:600;">Want the Full Picture?</p>
            <p style="font-size:14px;color:#64748b;margin:0 0 20px;line-height:1.5;">
              Your free score covers the basics. Our Summary Report adds competitor analysis,
              keyword data, content gaps, and a prioritized action plan — same format as our
              full audit.
            </p>
            <a href="https://buy.stripe.com/cNieVf4Wgg6Q70OcQT6wE04" style="display:inline-block;background:#0f766e;color:#ffffff;padding:12px 28px;border-radius:6px;text-decoration:none;font-size:14px;font-weight:600;">Get Summary Report — $197</a>
            <p style="font-size:12px;color:#94a3b8;margin:12px 0 0;">$197 credited toward Full Audit if you upgrade within 14 days</p>
          </div>
        </td></tr>
        <!-- Footer -->
        <tr><td style="background:#f8fafc;padding:20px 32px;border-top:1px solid #e2e8f0;">
          <p style="font-size:13px;color:#94a3b8;margin:0;">
            &copy; ${new Date().getFullYear()} BH SEO Intelligence &mdash; Behavioral Health Marketing Analytics<br/>
            <a href="https://bhseointelligence.com" style="color:#0f766e;">bhseointelligence.com</a>
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  await sendEmail(email, subject, html);
}

// ---------------------------------------------------------------------------
// Utility
// ---------------------------------------------------------------------------
function escHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
