import { verifySession, getSessionToken } from '@/lib/session';
import { getThreads, saveThreads } from '@/lib/kv';
import { withUser } from '@/lib/identify-server';

const MAX_BODY_BYTES = 1_000_000;

function isThread(t) {
  return t && typeof t === 'object' && Array.isArray(t.messages)
    && t.messages.every(m => m && typeof m === 'object' && typeof m.role === 'string');
}

async function getEmail(request) {
  const token = getSessionToken(request);
  if (!token) return null;
  const payload = await verifySession(token);
  return payload?.email ?? null;
}

export const GET = withUser(async (request) => {
  const email = await getEmail(request);
  if (!email) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const threads = await getThreads(email);
  return Response.json({ threads });
});

export const PUT = withUser(async (request) => {
  const email = await getEmail(request);
  if (!email) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const raw = await request.text();
  if (raw.length > MAX_BODY_BYTES) {
    return Response.json({ error: 'Payload too large' }, { status: 413 });
  }
  let threads;
  try { ({ threads } = JSON.parse(raw)); } catch { threads = null; }
  if (!Array.isArray(threads) || !threads.every(isThread)) {
    return Response.json({ error: 'Invalid payload' }, { status: 400 });
  }

  await saveThreads(email, threads);
  return Response.json({ ok: true });
});
