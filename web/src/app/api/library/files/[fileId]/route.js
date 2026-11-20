import { NextResponse } from 'next/server';
import { getLibrary } from '@/lib/library';
import { getPerson } from '@/lib/allowlist';
import { canAccessDriveFolder } from '@/lib/access';
import { logger } from '@/lib/logger';
import { withUser } from '@/lib/identify-server';

export const GET = withUser(async (request, { params }) => {
  const { fileId } = await params;
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action') || 'view';

  const userEmail = (request.headers.get('x-user-email') || '').trim().toLowerCase();

  try {
    const { getFileMeta, getFileStream } = await getLibrary();
    const [meta, person] = await Promise.all([
      getFileMeta(fileId),
      userEmail ? getPerson(userEmail) : Promise.resolve(null),
    ]);

    const group = person?.group ?? 'financial-only';
    const parentFolderId = meta.parents?.[0];
    if (!canAccessDriveFolder(group, parentFolderId)) {
      logger.warn({ fileId, userEmail, group, parentFolderId }, 'file access denied');
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    logger.info(
      { action, fileId, fileName: meta.name || 'unknown', user: userEmail },
      'file access'
    );

    const streamRes = await getFileStream(fileId, meta.mimeType);

    const headers = new Headers();

    // Determine content type
    let contentType = streamRes.headers.get('content-type') || 'application/octet-stream';
    if (meta.mimeType === 'application/pdf') contentType = 'application/pdf';
    if (meta.mimeType === 'application/vnd.google-apps.spreadsheet') {
      contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    }
    headers.set('Content-Type', contentType);

    // Content disposition. Only PDFs and spreadsheets are ever served inline;
    // anything else (an HTML or SVG file dropped into the folder) downloads.
    const filename = meta.name || 'download';
    const inlineOk = contentType === 'application/pdf'
      || contentType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    const disposition =
      action === 'download' || !inlineOk
        ? `attachment; filename="${encodeURIComponent(filename)}"`
        : 'inline';
    headers.set('X-Content-Type-Options', 'nosniff');
    headers.set('Content-Disposition', disposition);

    // Content length if available
    const contentLength = streamRes.headers.get('content-length');
    if (contentLength) {
      headers.set('Content-Length', contentLength);
    }

    return new Response(streamRes.body, { headers });
  } catch (err) {
    if (err?.code === 'ENOENT' || /Unknown file/.test(err?.message || '')) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    logger.error({ err, fileId, action }, 'file access error');
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
});
