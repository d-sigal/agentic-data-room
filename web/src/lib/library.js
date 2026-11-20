/**
 * Picks the document library backend.
 *   - Google Drive when GOOGLE_SERVICE_ACCOUNT_KEY is set (production).
 *   - Local directory (LIBRARY_DIR, default ../corpus/library) otherwise.
 */
export function isLocalLibrary() {
  return !process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
}

export async function getLibrary() {
  return isLocalLibrary() ? import('./local_library') : import('./drive');
}
