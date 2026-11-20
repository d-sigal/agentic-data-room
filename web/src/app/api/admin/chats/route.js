import { getAllowedPeople, isAdminEmail } from '@/lib/allowlist';
import { getThreads } from '@/lib/kv';
import { logger } from '@/lib/logger';
import { withUser } from '@/lib/identify-server';

function getEmail(request) {
  return (request.headers.get('x-user-email') || '').trim().toLowerCase();
}

/** GET — list all users with thread counts and last activity (admin only) */
export const GET = withUser(async (request) => {
  const adminEmail = getEmail(request);
  if (!(await isAdminEmail(adminEmail))) {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const people = await getAllowedPeople();
    const summaries = await Promise.all(
      people.map(async (p) => {
        const threads = await getThreads(p.email);
        const lastActivity = threads.reduce((max, t) => Math.max(max, t.when || 0), 0);
        return {
          email: p.email,
          name: p.name,
          active: p.active,
          threadCount: threads.length,
          lastActivity: lastActivity || null,
        };
      }),
    );
    return Response.json(summaries);
  } catch (err) {
    logger.error({ err }, 'admin/chats GET error');
    return Response.json({ error: 'Something went wrong.' }, { status: 500 });
  }
});
