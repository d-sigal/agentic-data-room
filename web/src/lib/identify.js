/**
 * Identify the current user across observability platforms (Sentry + Hotjar).
 *
 * Call this once after you have the authenticated user object,
 * typically right after a successful `/api/auth/me` response.
 */
import * as Sentry from '@sentry/nextjs';

export function identifyUser({ email, name, isAdmin, group }) {
  if (!email) return;

  // --- Sentry (client-side) ---
  Sentry.setUser({
    id: email,
    email,
    username: name || email,
    isAdmin: !!isAdmin,
    group: group ?? 'financial-only',
  });

  // --- Hotjar ---
  if (typeof window !== 'undefined' && window.hj) {
    window.hj('identify', email, {
      name: name || '',
      isAdmin: !!isAdmin,
      group: group ?? 'financial-only',
    });
  }
}

/**
 * Clear the identified user (on logout).
 */
export function clearUserIdentity() {
  Sentry.setUser(null);
  // Hotjar doesn't have a formal "clear identity" API.
  // The next page load / login will re-identify.
}
