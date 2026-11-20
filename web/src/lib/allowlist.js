/**
 * KV-backed allowlist of people who can access the app.
 *
 * Data shape in KV (key = "allowlist"):
 * {
 *   "alice@example.com": {
 *     name: "Alice",
 *     active: true,
 *     admin: false,             // true = can manage users and change groups
 *     group: "financial-only",  // "financial-only" | "full" — corpus access scope
 *     invitedAt: null,          // null for seed users (pre-dated)
 *     invitedBy: null,          // null for seed users
 *     audit: [
 *       { action: "seeded", at: 1714300000 },
 *       { action: "invited", by: "...", at: 1714310000 },
 *       { action: "deactivated", by: "...", at: 1714400000 },
 *       { action: "reactivated", by: "...", at: 1714500000 },
 *       { action: "login", at: 1714600000 },
 *       { action: "group_changed", group: "full", by: "...", at: 1714700000 },
 *       { action: "admin_granted", by: "...", at: 1714800000 },
 *       { action: "admin_revoked", by: "...", at: 1714900000 },
 *     ]
 *   }
 * }
 */

import { store } from './store';

const KV_KEY = 'allowlist';
const LAST_LOGIN_PREFIX = 'lastlogin:';

/**
 * First-boot seed, read from ADMIN_EMAILS. Comma-separated, optional display
 * name after a colon:  ADMIN_EMAILS="alice@example.com:Alice,bob@example.com"
 * Everyone listed here becomes an active admin with full corpus access.
 */
function parseSeed() {
  return (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean)
    .map(entry => {
      const [email, name] = entry.split(':');
      const e = email.trim().toLowerCase();
      return { email: e, name: (name || e.split('@')[0]).trim() };
    });
}
const SEED_PEOPLE = parseSeed();
const BOOTSTRAP_ADMINS = new Set(SEED_PEOPLE.map(p => p.email));

/**
 * Get the full allowlist object from KV.
 * Seeds on first boot, backfills admin/group on existing entries if missing.
 */
async function getAllowlist() {
  let data = await store.get(KV_KEY);
  if (!data) {
    const now = Date.now();
    data = {};
    for (const p of SEED_PEOPLE) {
      data[p.email] = {
        name: p.name,
        active: true,
        admin: BOOTSTRAP_ADMINS.has(p.email),
        group: BOOTSTRAP_ADMINS.has(p.email) ? 'full' : 'financial-only',
        invitedAt: null,
        invitedBy: null,
        audit: [{ action: 'seeded', at: now }],
      };
    }
    await store.set(KV_KEY, data);
    return data;
  }

  // Migration: backfill missing fields and rename 'limited' → 'financial-only'.
  let dirty = false;
  for (const [email, entry] of Object.entries(data)) {
    if (entry.admin === undefined) { entry.admin = BOOTSTRAP_ADMINS.has(email); dirty = true; }
    if (entry.group === undefined)  { entry.group = 'financial-only'; dirty = true; }
    if (entry.group === 'limited')  { entry.group = 'financial-only'; dirty = true; }
  }
  if (dirty) await store.set(KV_KEY, data);

  return data;
}

/**
 * Write the full allowlist object to KV.
 */
async function saveAllowlist(data) {
  await store.set(KV_KEY, data);
}

/**
 * Check if an email is on the allowlist AND active AND not deleted.
 */
export async function isAllowedEmail(email) {
  const normalized = email.trim().toLowerCase();
  const data = await getAllowlist();
  const entry = data[normalized];
  return !!entry && entry.active !== false && !entry.deleted;
}

/**
 * Check if an email is on the allowlist (regardless of active status).
 */
export async function isOnAllowlist(email) {
  const normalized = email.trim().toLowerCase();
  const data = await getAllowlist();
  return !!data[normalized];
}

/**
 * Get a single person's data. Returns null if not found.
 */
export async function getPerson(email) {
  const normalized = email.trim().toLowerCase();
  const data = await getAllowlist();
  if (!data[normalized]) return null;
  const entry = data[normalized];
  const lastLoginAt = await store.get(`${LAST_LOGIN_PREFIX}${normalized}`);
  return {
    email: normalized,
    name: entry.name,
    active: entry.active !== false && !entry.deleted,
    admin: entry.admin === true,
    group: entry.group ?? 'financial-only',
    invitedAt: entry.invitedAt,
    invitedBy: entry.invitedBy,
    lastLoginAt: lastLoginAt ?? null,
    deleted: !!entry.deleted,
    deletedAt: entry.deletedAt ?? null,
    deletedBy: entry.deletedBy ?? null,
    audit: entry.audit ?? [],
  };
}

/** Returns true if the email belongs to an admin user. */
export async function isAdminEmail(email) {
  const person = await getPerson(email.trim().toLowerCase());
  return !!person && person.admin === true && person.active && !person.deleted;
}

/**
 * Get all people on the allowlist with full metadata.
 */
export async function getAllowedPeople() {
  const data = await getAllowlist();
  const people = [];
  for (const [email, entry] of Object.entries(data)) {
    if (entry.deleted) continue; // skip soft-deleted users
    const lastLoginAt = await store.get(`${LAST_LOGIN_PREFIX}${email}`);
    people.push({
      email,
      name: entry.name,
      active: entry.active !== false,
      admin: entry.admin === true,
      group: entry.group ?? 'financial-only',
      invitedAt: entry.invitedAt,
      invitedBy: entry.invitedBy,
      lastLoginAt: lastLoginAt ?? null,
      audit: entry.audit ?? [],
    });
  }
  return people;
}

/**
 * Add a new person to the allowlist (invite).
 */
export async function addPerson(email, name, invitedBy) {
  const normalized = email.trim().toLowerCase();
  const data = await getAllowlist();

  if (data[normalized] && !data[normalized].deleted) {
    throw new Error('User already exists on the allowlist.');
  }

  // Re-inviting a soft-deleted user revives their entry, keeping the audit trail.
  if (data[normalized]?.deleted) {
    const entry = data[normalized];
    const now = Date.now();
    entry.deleted = false;
    delete entry.deletedAt;
    delete entry.deletedBy;
    entry.active = true;
    if (name) entry.name = name;
    entry.invitedAt = now;
    entry.invitedBy = invitedBy;
    entry.audit = [...(entry.audit ?? []), { action: 'invited', by: invitedBy, at: now }];

    // Remove from deactivated set so middleware allows them
    await store.srem('deactivated', normalized);

    await saveAllowlist(data);
    const lastLoginAt = await store.get(`${LAST_LOGIN_PREFIX}${normalized}`);
    return {
      email: normalized,
      name: entry.name,
      active: true,
      admin: entry.admin === true,
      group: entry.group ?? 'financial-only',
      invitedAt: now,
      invitedBy,
      lastLoginAt: lastLoginAt ?? null,
      audit: entry.audit,
    };
  }

  const now = Date.now();
  data[normalized] = {
    name: name || normalized.split('@')[0],
    active: true,
    admin: false,
    group: 'financial-only',
    invitedAt: now,
    invitedBy,
    audit: [{ action: 'invited', by: invitedBy, at: now }],
  };

  await saveAllowlist(data);
  const lastLoginAt = await store.get(`${LAST_LOGIN_PREFIX}${normalized}`);
  return {
    email: normalized,
    name: data[normalized].name,
    active: true,
    admin: false,
    group: 'financial-only',
    invitedAt: now,
    invitedBy,
    lastLoginAt: lastLoginAt ?? null,
    audit: data[normalized].audit,
  };
}

/**
 * Set a person's active status (deactivate / reactivate).
 */
export async function setPersonActive(email, active, changedBy) {
  const normalized = email.trim().toLowerCase();
  const data = await getAllowlist();

  if (!data[normalized]) {
    throw new Error('User not found on the allowlist.');
  }

  if (data[normalized].active === active) {
    // No change needed
    const lastLoginAt = await store.get(`${LAST_LOGIN_PREFIX}${normalized}`);
    return {
      email: normalized,
      name: data[normalized].name,
      active,
      invitedAt: data[normalized].invitedAt,
      invitedBy: data[normalized].invitedBy,
      lastLoginAt: lastLoginAt ?? null,
      audit: data[normalized].audit,
    };
  }

  const now = Date.now();
  data[normalized].active = active;
  data[normalized].audit = [
    ...(data[normalized].audit ?? []),
    { action: active ? 'reactivated' : 'deactivated', by: changedBy, at: now },
  ];

  // Update deactivated set in Redis (for fast middleware check)
  if (active) {
    await store.srem('deactivated', normalized);
  } else {
    await store.sadd('deactivated', normalized);
  }

  await saveAllowlist(data);
  const lastLoginAt = await store.get(`${LAST_LOGIN_PREFIX}${normalized}`);
  return {
    email: normalized,
    name: data[normalized].name,
    active,
    invitedAt: data[normalized].invitedAt,
    invitedBy: data[normalized].invitedBy,
    lastLoginAt: lastLoginAt ?? null,
    audit: data[normalized].audit,
  };
}

/**
 * Set a person's corpus access group ("financial-only" | "full").
 */
export async function setPersonGroup(email, group, changedBy) {
  const normalized = email.trim().toLowerCase();
  if (group !== 'financial-only' && group !== 'full') {
    throw new Error('Invalid group. Must be "financial-only" or "full".');
  }
  const data = await getAllowlist();
  if (!data[normalized]) throw new Error('User not found on the allowlist.');

  const now = Date.now();
  data[normalized].group = group;
  data[normalized].audit = [
    ...(data[normalized].audit ?? []),
    { action: 'group_changed', group, by: changedBy, at: now },
  ];

  await saveAllowlist(data);
  const lastLoginAt = await store.get(`${LAST_LOGIN_PREFIX}${normalized}`);
  return {
    email: normalized,
    name: data[normalized].name,
    active: data[normalized].active !== false,
    admin: data[normalized].admin === true,
    group,
    invitedAt: data[normalized].invitedAt,
    invitedBy: data[normalized].invitedBy,
    lastLoginAt: lastLoginAt ?? null,
    audit: data[normalized].audit,
  };
}

/**
 * Grant or revoke admin status for a user.
 */
export async function setPersonAdmin(email, admin, changedBy) {
  const normalized = email.trim().toLowerCase();
  const data = await getAllowlist();
  if (!data[normalized]) throw new Error('User not found on the allowlist.');

  const now = Date.now();
  data[normalized].admin = admin;
  data[normalized].audit = [
    ...(data[normalized].audit ?? []),
    { action: admin ? 'admin_granted' : 'admin_revoked', by: changedBy, at: now },
  ];

  await saveAllowlist(data);
  const lastLoginAt = await store.get(`${LAST_LOGIN_PREFIX}${normalized}`);
  return {
    email: normalized,
    name: data[normalized].name,
    active: data[normalized].active !== false,
    admin,
    group: data[normalized].group ?? 'financial-only',
    invitedAt: data[normalized].invitedAt,
    invitedBy: data[normalized].invitedBy,
    lastLoginAt: lastLoginAt ?? null,
    audit: data[normalized].audit,
  };
}

/**
 * Soft-delete a person (marks as deleted, does not remove from allowlist).
 */
export async function deletePerson(email, deletedBy) {
  const normalized = email.trim().toLowerCase();
  const data = await getAllowlist();

  if (!data[normalized]) {
    throw new Error('User not found on the allowlist.');
  }

  if (data[normalized].deleted) {
    throw new Error('User is already deleted.');
  }

  const now = Date.now();
  data[normalized].deleted = true;
  data[normalized].deletedAt = now;
  data[normalized].deletedBy = deletedBy;
  data[normalized].active = false;
  data[normalized].audit = [
    ...(data[normalized].audit ?? []),
    { action: 'deleted', by: deletedBy, at: now },
  ];

  // Add to deactivated set so middleware blocks them
  await store.sadd('deactivated', normalized);

  await saveAllowlist(data);
  const lastLoginAt = await store.get(`${LAST_LOGIN_PREFIX}${normalized}`);
  return {
    email: normalized,
    name: data[normalized].name,
    active: false,
    admin: data[normalized].admin === true,
    group: data[normalized].group ?? 'financial-only',
    invitedAt: data[normalized].invitedAt,
    invitedBy: data[normalized].invitedBy,
    lastLoginAt: lastLoginAt ?? null,
    deleted: true,
    deletedAt: now,
    deletedBy,
    audit: data[normalized].audit,
  };
}

/**
 * Restore a soft-deleted person.
 */
export async function restorePerson(email, restoredBy) {
  const normalized = email.trim().toLowerCase();
  const data = await getAllowlist();

  if (!data[normalized]) {
    throw new Error('User not found on the allowlist.');
  }

  if (!data[normalized].deleted) {
    throw new Error('User is not deleted.');
  }

  const now = Date.now();
  data[normalized].deleted = false;
  delete data[normalized].deletedAt;
  delete data[normalized].deletedBy;
  data[normalized].active = true;
  data[normalized].audit = [
    ...(data[normalized].audit ?? []),
    { action: 'restored', by: restoredBy, at: now },
  ];

  // Remove from deactivated set so middleware allows them
  await store.srem('deactivated', normalized);

  await saveAllowlist(data);
  const lastLoginAt = await store.get(`${LAST_LOGIN_PREFIX}${normalized}`);
  return {
    email: normalized,
    name: data[normalized].name,
    active: true,
    admin: data[normalized].admin === true,
    group: data[normalized].group ?? 'financial-only',
    invitedAt: data[normalized].invitedAt,
    invitedBy: data[normalized].invitedBy,
    lastLoginAt: lastLoginAt ?? null,
    deleted: false,
    audit: data[normalized].audit,
  };
}

/**
 * Get all soft-deleted people.
 */
export async function getDeletedPeople() {
  const data = await getAllowlist();
  const people = [];
  for (const [email, entry] of Object.entries(data)) {
    if (!entry.deleted) continue;
    const lastLoginAt = await store.get(`${LAST_LOGIN_PREFIX}${email}`);
    people.push({
      email,
      name: entry.name,
      active: false,
      admin: entry.admin === true,
      group: entry.group ?? 'financial-only',
      invitedAt: entry.invitedAt,
      invitedBy: entry.invitedBy,
      lastLoginAt: lastLoginAt ?? null,
      deleted: true,
      deletedAt: entry.deletedAt,
      deletedBy: entry.deletedBy,
      audit: entry.audit ?? [],
    });
  }
  return people;
}

/**
 * Record a login event for a user.
 * Writes lastLoginAt to a separate KV key (fast, no full allowlist read).
 * Also appends to audit log in the allowlist (less frequent).
 */
export async function recordLogin(email) {
  const normalized = email.trim().toLowerCase();
  const now = Date.now();

  // Fast path — separate key for quick reads in verify-code
  await store.set(`${LAST_LOGIN_PREFIX}${normalized}`, now);

  // Audit log in allowlist (read-modify-write — acceptable at login frequency)
  const data = await getAllowlist();
  if (data[normalized]) {
    data[normalized].audit = [...(data[normalized].audit ?? []), { action: 'login', at: now }];
    await saveAllowlist(data);
  }
}
