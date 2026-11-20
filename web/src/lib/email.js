import { Resend } from 'resend';
import { randomInt } from 'crypto';
import { APP_NAME } from '@/config';

let _resend;
function getResend() {
  if (!_resend) _resend = new Resend(process.env.RESEND_API_KEY);
  return _resend;
}

/**
 * Generate a random 6-digit code.
 */
export function generateCode() {
  return String(randomInt(100000, 1000000));
}

/**
 * Send an OTP email via Resend.
 * @param {string} email - Recipient email
 * @param {string} code - 6-digit OTP code
 * @param {string} brandName - Brand name for the email
 */
export async function sendInviteEmail(email, invitedBy) {
  if (!process.env.RESEND_API_KEY) {
    if (process.env.NODE_ENV === 'production') throw new Error('RESEND_API_KEY is not set.');
    console.log(`[DEV] Invite email for ${email}, invited by ${invitedBy}`);
    return;
  }

  const appUrl = process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>You're invited to ${APP_NAME}</title>
  <style>
    body, table, td, a { -webkit-font-smoothing: antialiased; -webkit-text-size-adjust: 100%; }
    body { margin: 0; padding: 0; background-color: #f5f3ef; }
    a { color: #1a1a1a; text-decoration: underline; }
  </style>
</head>
<body style="margin:0; padding:0; background-color:#f5f3ef; font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f3ef; padding:48px 0;">
    <tr>
      <td align="center">

        <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="background-color:#ffffff; border:1px solid #e0dbd4; border-radius:6px; overflow:hidden;">
          <tr>
            <td style="height:4px; background-color:#1a1a1a;"></td>
          </tr>
          <tr>
            <td style="padding:48px 48px 40px;">

              <p style="margin:0 0 32px; font-family:'SF Mono',SFMono-Regular,Consolas,'Liberation Mono',Menlo,monospace; font-size:11px; letter-spacing:0.1em; text-transform:uppercase; color:#8a8580;">${APP_NAME}</p>

              <h1 style="margin:0 0 16px; font-size:22px; font-weight:600; color:#1a1a1a; line-height:1.3;">You're invited to ${APP_NAME}</h1>

              <p style="margin:0 0 32px; font-size:15px; line-height:1.6; color:#4a4540;">
                You've been invited to join the ${APP_NAME} workspace by <strong style="color:#1a1a1a;">${invitedBy}</strong>.
              </p>

              <p style="margin:0 0 24px; font-size:15px; line-height:1.6; color:#4a4540;">
                Click the button below to open ${APP_NAME} and sign in with your email address. You'll receive a verification code to complete sign-in.
              </p>

              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
                <tr>
                  <td align="center">
                    <a href="${appUrl}" style="display:inline-block; padding:14px 32px; background-color:#1a1a1a; color:#ffffff; font-size:15px; font-weight:500; text-decoration:none; border-radius:6px;">Open ${APP_NAME}</a>
                  </td>
                </tr>
              </table>

              <p style="margin:0; font-size:13px; line-height:1.5; color:#8a8580;">
                If you weren't expecting this invitation, you can safely ignore this email.
              </p>

            </td>
          </tr>
        </table>

        <p style="margin:24px 0 0; font-size:12px; line-height:1.5; color:#8a8580; text-align:center;">
          ${APP_NAME} &middot; This is an automated message
        </p>

      </td>
    </tr>
  </table>

</body>
</html>`;

  const text = `You're invited to ${APP_NAME}

You've been invited to join the ${APP_NAME} workspace by ${invitedBy}.

Open ${APP_NAME} at ${appUrl} and sign in with your email address. You'll receive a verification code to complete sign-in.

If you weren't expecting this invitation, you can safely ignore this email.

${APP_NAME} - This is an automated message`;

  return getResend().emails.send({
    from: process.env.EMAIL_FROM || 'Data Room <noreply@example.com>',
    to: email,
    subject: `You're invited to ${APP_NAME}`,
    html,
    text,
  });
}

export async function sendOtpEmail(email, code) {
  if (!process.env.RESEND_API_KEY) {
    // Never print codes in production: a missing key would otherwise leak
    // every OTP into the log sink while login still reports success.
    if (process.env.NODE_ENV === 'production') throw new Error('RESEND_API_KEY is not set.');
    console.log(`[DEV] OTP for ${email}: ${code}`);
    return;
  }

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your verification code</title>
  <style>
    body, table, td, a { -webkit-font-smoothing: antialiased; -webkit-text-size-adjust: 100%; }
    body { margin: 0; padding: 0; background-color: #f5f3ef; }
    a { color: #1a1a1a; text-decoration: underline; }
  </style>
</head>
<body style="margin:0; padding:0; background-color:#f5f3ef; font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">

  <!-- Outer wrapper -->
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f3ef; padding:48px 0;">
    <tr>
      <td align="center">

        <!-- Card -->
        <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="background-color:#ffffff; border:1px solid #e0dbd4; border-radius:6px; overflow:hidden;">
          
          <!-- Top accent bar -->
          <tr>
            <td style="height:4px; background-color:#1a1a1a;"></td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding:48px 48px 40px;">

              <!-- Brand -->
              <p style="margin:0 0 32px; font-family:'SF Mono',SFMono-Regular,Consolas,'Liberation Mono',Menlo,monospace; font-size:11px; letter-spacing:0.1em; text-transform:uppercase; color:#8a8580;">${APP_NAME}</p>

              <!-- Heading -->
              <h1 style="margin:0 0 16px; font-size:22px; font-weight:600; color:#1a1a1a; line-height:1.3;">Your verification code</h1>

              <!-- Body -->
              <p style="margin:0 0 32px; font-size:15px; line-height:1.6; color:#4a4540;">
                Enter this code to sign in. It expires in 5 minutes.
              </p>

              <!-- Code block -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
                <tr>
                  <td style="background-color:#f5f3ef; border:1px solid #e0dbd4; border-radius:6px; padding:24px; text-align:center;">
                    <span style="font-family:'SF Mono',SFMono-Regular,Consolas,'Liberation Mono',Menlo,monospace; font-size:36px; font-weight:600; letter-spacing:0.25em; color:#1a1a1a;">${code.substring(0, 3)} ${code.substring(3)}</span>
                  </td>
                </tr>
              </table>

              <!-- Fine print -->
              <p style="margin:0; font-size:13px; line-height:1.5; color:#8a8580;">
                If you didn't request this code, you can safely ignore this email.
              </p>

            </td>
          </tr>

        </table>

        <!-- Footer -->
        <p style="margin:24px 0 0; font-size:12px; line-height:1.5; color:#8a8580; text-align:center;">
          ${APP_NAME} &middot; This is an automated message
        </p>

      </td>
    </tr>
  </table>

</body>
</html>`;

  const text = `Your verification code

Enter this code to sign in. It expires in 5 minutes.

${code.substring(0, 3)} ${code.substring(3)}

If you didn't request this code, you can safely ignore this email.

${APP_NAME} - This is an automated message`;

  return getResend().emails.send({
    from: process.env.EMAIL_FROM || 'Data Room <noreply@example.com>',
    to: email,
    subject: 'Your verification code',
    html,
    text,
  });
}
