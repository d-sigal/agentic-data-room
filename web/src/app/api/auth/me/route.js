import { verifySession, getSessionToken } from '@/lib/session';
import { store } from '@/lib/store';
import { getPerson } from '@/lib/allowlist';

export async function GET(request) {
  const token = getSessionToken(request);

  if (!token) {
    return Response.json({ error: 'No session' }, { status: 401 });
  }

  const payload = await verifySession(token);

  if (!payload) {
    return Response.json({ error: 'Invalid session' }, { status: 401 });
  }

  // Check if user has been deactivated
  const deactivated = (await store.sismember('deactivated', payload.email)) === 1;

  if (deactivated) {
    return Response.json({ error: 'Account deactivated', deactivated: true }, { status: 403 });
  }

  const person = await getPerson(payload.email);
  return Response.json({
    email: payload.email,
    name: payload.name || '',
    isAdmin: person?.admin === true,
    group: person?.group ?? 'financial-only',
  });
}
