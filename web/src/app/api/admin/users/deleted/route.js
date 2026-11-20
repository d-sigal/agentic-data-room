import { getDeletedPeople, isAdminEmail } from '@/lib/allowlist';
import { logger } from '@/lib/logger';

function getEmail(request) {
  return (request.headers.get('x-user-email') || '').trim().toLowerCase();
}

/** GET — list all soft-deleted users (admin only) */
export async function GET(request) {
  const adminEmail = getEmail(request);
  if (!(await isAdminEmail(adminEmail))) {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const people = await getDeletedPeople();
    return Response.json(people);
  } catch (err) {
    logger.error({ err }, 'admin/users/deleted GET error');
    return Response.json({ error: 'Something went wrong.' }, { status: 500 });
  }
}