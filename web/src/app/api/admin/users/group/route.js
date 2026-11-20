import { setPersonGroup, isAdminEmail } from '@/lib/allowlist';
import { logger } from '@/lib/logger';
import { withUser } from '@/lib/identify-server';

function getEmail(request) {
  return (request.headers.get('x-user-email') || '').trim().toLowerCase();
}

/** PATCH — set a user's corpus access group (admin only) */
export const PATCH = withUser(async (request) => {
  const adminEmail = getEmail(request);
  if (!(await isAdminEmail(adminEmail))) {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const { email: rawEmail, group } = await request.json();

    if (!rawEmail || typeof rawEmail !== 'string') {
      return Response.json({ error: 'Email is required.' }, { status: 400 });
    }
    if (group !== 'financial-only' && group !== 'full') {
      return Response.json({ error: 'Group must be "financial-only" or "full".' }, { status: 400 });
    }

    const normalized = rawEmail.trim().toLowerCase();
    const person = await setPersonGroup(normalized, group, adminEmail);
    logger.info({ email: normalized, group, changedBy: adminEmail }, 'user group changed');
    return Response.json(person);
  } catch (err) {
    if (err.message === 'User not found on the allowlist.') {
      return Response.json({ error: err.message }, { status: 404 });
    }
    logger.error({ err }, 'admin/users/group error');
    return Response.json({ error: 'Something went wrong.' }, { status: 500 });
  }
});
