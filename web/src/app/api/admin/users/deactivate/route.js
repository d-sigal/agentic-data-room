import { setPersonActive, isAdminEmail } from '@/lib/allowlist';
import { logger } from '@/lib/logger';
import { withUser } from '@/lib/identify-server';

function getEmail(request) {
  return (request.headers.get('x-user-email') || '').trim().toLowerCase();
}

/** PATCH — deactivate a user */
export const PATCH = withUser(async (request) => {
  const adminEmail = getEmail(request);
  if (!(await isAdminEmail(adminEmail))) {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const { email: rawEmail } = await request.json();

    if (!rawEmail || typeof rawEmail !== 'string') {
      return Response.json({ error: 'Email is required.' }, { status: 400 });
    }

    const normalized = rawEmail.trim().toLowerCase();

    // Cannot deactivate yourself
    if (normalized === adminEmail) {
      return Response.json({ error: 'You cannot deactivate your own account.' }, { status: 400 });
    }

    const person = await setPersonActive(normalized, false, adminEmail);
    logger.info({ email: normalized, deactivatedBy: adminEmail }, 'user deactivated');
    return Response.json(person);
  } catch (err) {
    if (err.message === 'User not found on the allowlist.') {
      return Response.json({ error: err.message }, { status: 404 });
    }
    logger.error({ err }, 'admin/users/deactivate error');
    return Response.json({ error: 'Something went wrong.' }, { status: 500 });
  }
});
