import { getAllowedPeople, addPerson, isAdminEmail } from '@/lib/allowlist';
import { sendInviteEmail } from '@/lib/email';
import { logger } from '@/lib/logger';
import { withUser } from '@/lib/identify-server';

function getEmail(request) {
  return (request.headers.get('x-user-email') || '').trim().toLowerCase();
}

/** GET — list all users (admin only) */
export const GET = withUser(async (request) => {
  if (!(await isAdminEmail(getEmail(request)))) {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }
  try {
    const people = await getAllowedPeople();
    return Response.json(people);
  } catch (err) {
    logger.error({ err }, 'admin/users GET error');
    return Response.json({ error: 'Something went wrong.' }, { status: 500 });
  }
});

/** POST — invite a new user (admin only) */
export const POST = withUser(async (request) => {
  const adminEmail = getEmail(request);
  if (!(await isAdminEmail(adminEmail))) {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const { email: rawEmail, name } = await request.json();

    if (!rawEmail || typeof rawEmail !== 'string') {
      return Response.json({ error: 'Email is required.' }, { status: 400 });
    }

    const normalized = rawEmail.trim().toLowerCase();

    const person = await addPerson(normalized, name, adminEmail);

    try {
      await sendInviteEmail(normalized, adminEmail);
    } catch (emailErr) {
      logger.error({ err: emailErr, email: normalized }, 'sendInviteEmail error');
    }

    logger.info({ email: normalized, invitedBy: adminEmail }, 'user invited');
    return Response.json(person, { status: 201 });
  } catch (err) {
    if (err.message === 'User already exists on the allowlist.') {
      return Response.json({ error: err.message }, { status: 409 });
    }
    logger.error({ err }, 'admin/users POST error');
    return Response.json({ error: 'Something went wrong.' }, { status: 500 });
  }
});
