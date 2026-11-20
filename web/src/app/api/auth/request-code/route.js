import { store } from '@/lib/store';
import { isAllowedEmail } from '@/lib/allowlist';
import { generateCode, sendOtpEmail } from '@/lib/email';
import { logger } from '@/lib/logger';

export async function POST(request) {
  try {
    const { email } = await request.json();

    if (!email || typeof email !== 'string') {
      return Response.json({ error: 'Email is required.' }, { status: 400 });
    }

    const normalized = email.trim().toLowerCase();

    const authorized = await isAllowedEmail(normalized);
    if (authorized) {
      logger.info({ email: normalized, authorized: true }, 'login request');
    } else {
      logger.warn({ email: normalized, authorized: false }, 'login request');
    }

    // Rate limit first, for every email, so the 429 cannot be used to tell
    // allowlisted addresses from unknown ones.
    const rateKey = `ratelimit:${normalized}`;
    const existing = await store.get(rateKey);
    if (existing) {
      return Response.json({ error: 'A code was already sent recently. Please wait a moment.' }, { status: 429 });
    }
    await store.set(rateKey, '1', { ex: 60 });

    // Unknown emails get the same success response and no code.
    if (!authorized) {
      return Response.json({ ok: true });
    }

    // Generate and store code (TTL 5 minutes), reset the attempt counter.
    const code = generateCode();
    await store.set(`otp:${normalized}`, code, { ex: 300 });
    await store.del(`otp-attempts:${normalized}`);

    // Send email
    await sendOtpEmail(normalized, code);

    return Response.json({ ok: true });
  } catch (err) {
    logger.error({ err }, 'request-code error');
    return Response.json({ error: 'Something went wrong. Please try again.' }, { status: 500 });
  }
}
