import { NextResponse } from 'next/server';
import { getLibrary } from '@/lib/library';
import { getCached, setCached } from '@/lib/cache';
import { getPerson } from '@/lib/allowlist';
import { canAccessDriveFolder } from '@/lib/access';
import { withUser } from '@/lib/identify-server';

export const GET = withUser(async (request) => {
  const { searchParams } = new URL(request.url);

  // folderId — the folder being browsed (absent = Drive root). The top-level
  // folder used for the access check is derived server-side, never trusted
  // from the client.
  const folderId = searchParams.get('folderId');

  const userEmail = (request.headers.get('x-user-email') || '').trim().toLowerCase();
  const person = userEmail ? await getPerson(userEmail) : null;
  const group = person?.group ?? 'financial-only';

  // Cache key scoped per group + folder. v3 busts prior recursive-listing entries.
  const cacheKey = `library:v3:${group}:${folderId || 'root'}`;
  const cached = await getCached(cacheKey);
  if (cached) return NextResponse.json(cached);

  try {
    const { listFolders, listSubfolders, listFiles, getTopFolderId } = await getLibrary();
    let payload;

    if (!folderId) {
      // ── Root view: list top-level Drive folders, no files ──────────────────
      const allFolders = await listFolders();

      // For restricted groups, only show the allowed top-level folders.
      const folders =
        group === 'full'
          ? allFolders
          : allFolders.filter((f) => canAccessDriveFolder(group, f.id));

      payload = { folders, files: [] };
    } else {
      // ── Folder view: contents of a specific folder ─────────────────────────
      // Access is always checked against the top-level folder.
      const topFolderId = group === 'full' ? folderId : await getTopFolderId(folderId);
      if (!topFolderId || !canAccessDriveFolder(group, topFolderId)) {
        return NextResponse.json({ folders: [], files: [] });
      }

      const [folders, files] = await Promise.all([
        listSubfolders(folderId),
        listFiles(folderId),
      ]);

      payload = { folders, files };
    }

    // Only cache non-empty results so misconfigured envs don't lock in blanks.
    if (payload.folders.length > 0 || payload.files.length > 0) {
      await setCached(cacheKey, payload);
    }
    return NextResponse.json(payload);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
});
