import { deletePerson, isAdminEmail } from '@/lib/allowlist';
import { logger } from '@/lib/logger';

function getEmail(request) {
  return (request.headers.get('x-user-email') || '').trim().toLowerCase();
}

/** PATCH — soft-delete a user */
export async function PATCH(request) {
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

    // Cannot delete yourself
    if (normalized === adminEmail) {
      return Response.json({ error: 'You cannot delete your own account.' }, { status: 400 });
    }

    const person = await deletePerson(normalized, adminEmail);
    logger.info({ email: normalized, deletedBy: adminEmail }, 'user soft-deleted');
    return Response.json(person);
  } catch (err) {
    if (err.message === 'User not found on the allowlist.' || err.message === 'User is already deleted.') {
      return Response.json({ error: err.message }, { status: 404 });
    }
    logger.error({ err }, 'admin/users/delete error');
    return Response.json({ error: 'Something went wrong.' }, { status: 500 });
  }
}
