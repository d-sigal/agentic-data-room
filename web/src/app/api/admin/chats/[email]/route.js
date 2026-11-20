import { isAdminEmail, isOnAllowlist } from '@/lib/allowlist';
import { getThreads } from '@/lib/kv';
import { logger } from '@/lib/logger';
import { withUser } from '@/lib/identify-server';

function getEmail(request) {
  return (request.headers.get('x-user-email') || '').trim().toLowerCase();
}

/** GET — fetch threads for a specific user (admin only) */
export const GET = withUser(async (request, ctx) => {
  const adminEmail = getEmail(request);
  if (!(await isAdminEmail(adminEmail))) {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const params = await ctx.params;
    const target = decodeURIComponent(params.email || '').trim().toLowerCase();
    if (!target) {
      return Response.json({ error: 'Email is required.' }, { status: 400 });
    }
    if (!(await isOnAllowlist(target))) {
      return Response.json({ error: 'User not found.' }, { status: 404 });
    }

    const threads = await getThreads(target);
    return Response.json({ threads });
  } catch (err) {
    logger.error({ err }, 'admin/chats/[email] GET error');
    return Response.json({ error: 'Something went wrong.' }, { status: 500 });
  }
});
