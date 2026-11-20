/**
 * Local-files library backend. Used when GOOGLE_SERVICE_ACCOUNT_KEY is not
 * set. Serves a directory tree (LIBRARY_DIR, default ../corpus/library) with
 * the same shapes as drive.js so the API routes do not care which backend
 * is active.
 *
 * IDs are "local_" + base64url(relative path). Top-level folders are the
 * library "root" listing; a file's parent is its top-level folder id, which
 * is what the access rules check.
 */
import { promises as fs, createReadStream } from 'fs';
import { Readable } from 'stream';
import path from 'path';

export const LOCAL_ID_PREFIX = 'local_';

const MIME = {
  '.pdf': 'application/pdf',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  '.csv': 'text/csv',
  '.md': 'text/markdown',
  '.txt': 'text/plain',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
};

export function libraryDir() {
  return process.env.LIBRARY_DIR || path.join(process.cwd(), '..', 'corpus', 'library');
}

export function encodeId(rel) {
  return LOCAL_ID_PREFIX + Buffer.from(rel, 'utf8').toString('base64url');
}

export function decodeId(id) {
  if (!id || !id.startsWith(LOCAL_ID_PREFIX)) return null;
  const rel = Buffer.from(id.slice(LOCAL_ID_PREFIX.length), 'base64url').toString('utf8');
  // Reject anything that escapes the library directory, then return the
  // normalized relative path so "Finance/../Legal/x.pdf" cannot pass an
  // access check as "Finance" and be served from "Legal".
  const root = path.resolve(libraryDir());
  const abs = path.resolve(root, rel);
  if (abs !== root && !abs.startsWith(root + path.sep)) return null;
  const norm = path.relative(root, abs);
  if (path.isAbsolute(norm) || norm.split(path.sep).includes('..')) return null;
  return norm;
}

/** Id of the top-level folder an id lives under (used by access rules). */
export async function getTopFolderId(id) {
  const top = topFolderName(id);
  return top === null ? null : encodeId(top);
}

/** Top-level folder name for an id (used by access rules). */
export function topFolderName(id) {
  const rel = decodeId(id);
  if (rel === null) return null;
  return rel.split(path.sep)[0] || null;
}

function kindOf(mimeType, name) {
  if (mimeType === 'application/pdf') return /deck|pitch|presentation|slide/i.test(name) ? 'deck' : 'doc';
  if (mimeType === MIME['.xlsx'] || mimeType === MIME['.csv']) return 'sheet';
  return 'doc';
}

function formatBytes(bytes) {
  if (!bytes) return '—';
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return parseFloat((bytes / Math.pow(1024, i)).toFixed(1)) + ' ' + sizes[i];
}

async function entries(rel) {
  const abs = path.join(libraryDir(), rel);
  try {
    const list = await fs.readdir(abs, { withFileTypes: true });
    return list.filter(e => !e.name.startsWith('.')).sort((a, b) => a.name.localeCompare(b.name));
  } catch {
    return [];
  }
}

export async function listFolders() {
  const list = await entries('');
  return list.filter(e => e.isDirectory()).map(e => ({ id: encodeId(e.name), name: e.name }));
}

export async function listSubfolders(folderId) {
  const rel = decodeId(folderId);
  if (rel === null) return [];
  const list = await entries(rel);
  return list.filter(e => e.isDirectory()).map(e => ({ id: encodeId(path.join(rel, e.name)), name: e.name }));
}

export async function listFiles(folderId) {
  const rel = decodeId(folderId);
  if (rel === null) return [];
  const list = await entries(rel);
  const files = [];
  for (const e of list) {
    if (!e.isFile()) continue;
    const relPath = path.join(rel, e.name);
    const stat = await fs.stat(path.join(libraryDir(), relPath));
    const mimeType = MIME[path.extname(e.name).toLowerCase()] || 'application/octet-stream';
    files.push({
      id: encodeId(relPath),
      name: e.name,
      mimeType,
      size: formatBytes(stat.size),
      modifiedTime: stat.mtime.toISOString(),
      kind: kindOf(mimeType, e.name),
    });
  }
  return files;
}

export async function listFilesRecursive(folderId, pathSegments = []) {
  const [files, subfolders] = await Promise.all([listFiles(folderId), listSubfolders(folderId)]);
  const nested = await Promise.all(
    subfolders.map(sub => listFilesRecursive(sub.id, [...pathSegments, sub.name]).catch(() => []))
  );
  return [...files.map(f => ({ ...f, pathSegments })), ...nested.flat()];
}

export async function getFileMeta(fileId) {
  const rel = decodeId(fileId);
  if (rel === null) throw new Error('Unknown file');
  const abs = path.join(libraryDir(), rel);
  const stat = await fs.stat(abs);
  const name = path.basename(rel);
  const top = rel.split(path.sep)[0];
  return {
    id: fileId,
    name,
    mimeType: MIME[path.extname(name).toLowerCase()] || 'application/octet-stream',
    size: String(stat.size),
    parents: [encodeId(top)],
  };
}

export async function getFileStream(fileId) {
  const rel = decodeId(fileId);
  if (rel === null) throw new Error('Unknown file');
  const abs = path.join(libraryDir(), rel);
  const stat = await fs.stat(abs);
  const mimeType = MIME[path.extname(abs).toLowerCase()] || 'application/octet-stream';
  return new Response(Readable.toWeb(createReadStream(abs)), {
    headers: { 'content-type': mimeType, 'content-length': String(stat.size) },
  });
}
