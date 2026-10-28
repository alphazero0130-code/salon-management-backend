import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const sendOtpEmail = async (email, otp, purpose) => {
  if (!process.env.RESEND_API_KEY || !process.env.EMAIL_FROM) {
    throw new Error("RESEND_API_KEY and EMAIL_FROM must be configured");
  }

  const subject =
    purpose === "registration"
      ? "Verify your Salon Management account"
      : "Reset your Salon Management password";

  const heading =
    purpose === "registration"
      ? "Verify your email address"
      : "Password reset verification";

  const message =
    purpose === "registration"
      ? "Use the verification code below to finish creating your account."
      : "Use the verification code below to reset your password.";

  const { error } = await resend.emails.send({
    from: process.env.EMAIL_FROM,
    to: [email],
    subject,
    html: `
      <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">
        Your verification code is ${otp}. It expires in 10 minutes.
      </div>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;background-color:#f4f6f8;font-family:Arial,Helvetica,sans-serif;color:#17212b;">
        <tr>
          <td align="center" style="padding:40px 16px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;border-collapse:separate;border-spacing:0;background-color:#ffffff;border:1px solid #e6e9ed;border-radius:12px;">
              <tr>
                <td style="padding:32px 36px 12px;">
                  <p style="margin:0;color:#526777;font-size:12px;font-weight:bold;letter-spacing:2px;">SALON MANAGEMENT</p>
                </td>
              </tr>
              <tr>
                <td style="padding:12px 36px 32px;">
                  <h1 style="margin:0 0 12px;color:#17212b;font-size:25px;line-height:1.3;">${heading}</h1>
                  <p style="margin:0;color:#586572;font-size:15px;line-height:1.7;">${message}</p>
                  <p style="margin:24px 0 10px;color:#586572;font-size:13px;">YOUR VERIFICATION CODE</p>
                  <div style="padding:18px 12px;background-color:#f4f6f8;border:1px solid #e6e9ed;border-radius:8px;text-align:center;">
                    <span style="color:#17212b;font-size:32px;font-weight:bold;letter-spacing:8px;">${otp}</span>
                  </div>
                  <p style="margin:14px 0 0;color:#586572;font-size:13px;line-height:1.6;">This code expires in <strong>10 minutes</strong>. For your security, do not share it with anyone.</p>
                  <div style="height:1px;margin:26px 0;background-color:#e6e9ed;"></div>
                  <p style="margin:0;color:#7a858f;font-size:12px;line-height:1.6;">If you didn’t request this code, you can safely ignore this email.</p>
                </td>
              </tr>
            </table>
            <p style="margin:18px 0 0;color:#89939c;font-size:11px;">This is an automated message. Please do not reply.</p>
          </td>
        </tr>
      </table>
    `,
  });

  if (error) {
    throw new Error(error.message || "Unable to send verification email");
  }
};

export default sendOtpEmail;