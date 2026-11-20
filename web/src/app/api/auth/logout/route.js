import { clearSessionCookie } from '@/lib/session';

export async function POST() {
  const response = Response.json({ ok: true });
  clearSessionCookie(response);
  return response;
}
