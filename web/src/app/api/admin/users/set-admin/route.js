import { setPersonAdmin, isAdminEmail } from '@/lib/allowlist';
import { logger } from '@/lib/logger';
import { withUser } from '@/lib/identify-server';

function getEmail(request) {
  return (request.headers.get('x-user-email') || '').trim().toLowerCase();
}

/** PATCH — grant or revoke admin status (admin only, cannot change own status) */
export const PATCH = withUser(async (request) => {
  const adminEmail = getEmail(request);
  if (!(await isAdminEmail(adminEmail))) {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const { email: rawEmail, admin } = await request.json();

    if (!rawEmail || typeof rawEmail !== 'string') {
      return Response.json({ error: 'Email is required.' }, { status: 400 });
    }
    if (typeof admin !== 'boolean') {
      return Response.json({ error: 'admin must be a boolean.' }, { status: 400 });
    }

    const normalized = rawEmail.trim().toLowerCase();

    if (normalized === adminEmail) {
      return Response.json({ error: 'You cannot change your own admin status.' }, { status: 400 });
    }

    const person = await setPersonAdmin(normalized, admin, adminEmail);
    logger.info({ email: normalized, admin, changedBy: adminEmail }, 'user admin status changed');
    return Response.json(person);
  } catch (err) {
    if (err.message === 'User not found on the allowlist.') {
      return Response.json({ error: err.message }, { status: 404 });
    }
    logger.error({ err }, 'admin/users/set-admin error');
    return Response.json({ error: 'Something went wrong.' }, { status: 500 });
  }
});
