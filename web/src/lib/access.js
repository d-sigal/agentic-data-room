/**
 * Group access map — the single place to define what each group can see.
 *
 * Groups:
 *   "full"           — no restrictions, sees the entire corpus and all Drive folders.
 *   "financial-only" — restricted to the doc IDs and Drive folder IDs listed below.
 *
 * To change what financial-only users can access, edit the two arrays below.
 * No other file needs to change.
 *
 * Finding a Drive folder ID:
 *   As a full-access user, call GET /api/library in your browser devtools —
 *   the response contains folders[].id. Copy the id for whichever folder(s)
 *   financial-only users should see.
 */

import { GROUPS } from './groups';
import { topFolderName } from './local_library';

export { GROUPS };

export const GROUP_ACCESS = {
  'full': null, // null = unrestricted

  'financial-only': {
    /** Doc IDs from _index.md <doc id="..."> tags visible in chat. */
    chatDocIds: [
      'finance-financial-model',
    ],

    /**
     * Google Drive folder IDs whose contents are visible in the library
     * and whose files are downloadable.
     * Find these from GET /api/library → folders[].id (as a full-access user).
     */
    driveFolderIds: (process.env.LIMITED_GROUP_DRIVE_FOLDER_IDS || '')
      .split(',').map(s => s.trim()).filter(Boolean),

    /** Local-library mode: top-level folder names this group may open. */
    libraryFolders: (process.env.LIMITED_GROUP_LIBRARY_FOLDERS || 'Finance')
      .split(',').map(s => s.trim()).filter(Boolean),
  },
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getAccess(group) {
  // Use `in` — GROUP_ACCESS['full'] is intentionally null (unrestricted),
  // not a missing key, so ?? would wrongly fall through to the default.
  return group in GROUP_ACCESS ? GROUP_ACCESS[group] : GROUP_ACCESS['financial-only'];
}

// ─── Exports ─────────────────────────────────────────────────────────────────

/**
 * Build the chat corpus string for the given group from the full corpus text.
 */
export function buildChatCorpus(fullCorpus, group) {
  const access = getAccess(group);
  if (!access) return fullCorpus; // full

  const allowed = new Set(access.chatDocIds);
  const blocks = [];
  const docRegex = /<doc id="([^"]+)"[\s\S]*?<\/doc>/g;
  let match;
  while ((match = docRegex.exec(fullCorpus)) !== null) {
    if (allowed.has(match[1])) blocks.push(match[0]);
  }
  return blocks.join('\n\n');
}

/**
 * Returns true if the group may access the given Drive folder ID.
 */
export function canAccessDriveFolder(group, folderId) {
  const access = getAccess(group);
  if (!access) return true; // full
  if ((access.driveFolderIds || []).includes(folderId)) return true;
  // Local-library mode: ids encode a path; allow by top-level folder name.
  const top = topFolderName(folderId);
  return top !== null && (access.libraryFolders || []).includes(top);
}

/**
 * Filter a { folders, files } library payload to only what the group can see.
 */
export function filterLibrary({ folders, files }, group) {
  const access = getAccess(group);
  if (!access) return { folders, files }; // full

  const allowed = new Set(access.driveFolderIds || []);
  const allowedNames = new Set(access.libraryFolders || []);
  const visibleFolders = folders.filter((f) => allowed.has(f.id) || allowedNames.has(topFolderName(f.id)));
  const visibleFiles = files.filter((f) => allowed.has(f.folderId));

  return {
    folders: visibleFolders.map((f) => ({
      ...f,
      count: visibleFiles.filter((file) => file.folderId === f.id).length,
    })),
    files: visibleFiles,
  };
}
