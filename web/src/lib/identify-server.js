/**
 * Wrap an API route handler. Middleware has already verified the session
 * cookie and injected x-user-email / x-user-name. This wrapper:
 *   1. re-checks the allowlist on every call, so a deactivated or deleted
 *      user is cut off immediately rather than when the 7-day JWT expires
 *      (the edge middleware cannot always reach the store);
 *   2. identifies the user in Sentry.
 *
 *   import { withUser } from '@/lib/identify-server';
 *   export const POST = withUser(async (request, ctx) => { ... });
 */
import * as Sentry from '@sentry/nextjs';
import { getPerson } from '@/lib/allowlist';
import { store } from '@/lib/store';

export function withUser(handler) {
  return async (request, ctx) => {
    const email = (request.headers.get('x-user-email') || '').trim().toLowerCase();
    const name  = request.headers.get('x-user-name');

    if (!email) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const [person, deactivated] = await Promise.all([
      getPerson(email),
      store.sismember('deactivated', email),
    ]);
    if (!person || person.deleted || !person.active || deactivated === 1) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    Sentry.setUser({ id: email, email, username: name || email });
    return handler(request, ctx);
  };
}
