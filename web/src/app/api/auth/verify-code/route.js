import { timingSafeEqual } from 'crypto';
import { store } from '@/lib/store';
import { isAllowedEmail, getPerson, recordLogin } from '@/lib/allowlist';
import { createSession, setSessionCookie } from '@/lib/session';
import { logger } from '@/lib/logger';

const MAX_ATTEMPTS = 5;
const GENERIC = 'Invalid or expired code. Please request a new one.';

function safeEqual(a, b) {
  const x = Buffer.from(String(a));
  const y = Buffer.from(String(b));
  return x.length === y.length && timingSafeEqual(x, y);
}

export async function POST(request) {
  try {
    const { email, code } = await request.json();

    if (!email || !code || typeof email !== 'string' || typeof code !== 'string') {
      return Response.json({ error: 'Email and code are required.' }, { status: 400 });
    }

    const normalized = email.trim().toLowerCase();
    const otpKey = `otp:${normalized}`;
    const attemptsKey = `otp-attempts:${normalized}`;

    // Every failure path returns the same message so the response does not
    // reveal whether the email is on the allowlist or has a pending code.
    if (!(await isAllowedEmail(normalized))) {
      logger.warn({ email: normalized }, 'verify attempt for unauthorized email');
      return Response.json({ error: GENERIC }, { status: 400 });
    }

    const stored = await store.get(otpKey);
    if (!stored) {
      return Response.json({ error: GENERIC }, { status: 400 });
    }

    const attempts = Number(await store.get(attemptsKey)) || 0;
    if (attempts >= MAX_ATTEMPTS) {
      await store.del(otpKey);
      await store.del(attemptsKey);
      logger.warn({ email: normalized }, 'otp attempt limit reached, code invalidated');
      return Response.json({ error: GENERIC }, { status: 400 });
    }

    if (!safeEqual(stored, code.trim())) {
      await store.set(attemptsKey, attempts + 1, { ex: 300 });
      return Response.json({ error: GENERIC }, { status: 400 });
    }

    // Code matches: single use.
    await store.del(otpKey);
    await store.del(attemptsKey);

    recordLogin(normalized).catch(err => logger.error({ err }, 'recordLogin error'));

    const person = await getPerson(normalized);
    const token = await createSession(normalized, person?.name ?? '');
    const response = Response.json({ ok: true });
    setSessionCookie(response, token);
    return response;
  } catch (err) {
    logger.error({ err }, 'verify-code error');
    return Response.json({ error: 'Something went wrong. Please try again.' }, { status: 500 });
  }
}
