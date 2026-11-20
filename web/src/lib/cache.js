import { store } from './store';

const TTL = 300; // 5 minutes

export async function getCached(key) {
  try {
    return await store.get(key);
  } catch {
    return null;
  }
}

export async function setCached(key, value) {
  try {
    await store.set(key, value, { ex: TTL });
  } catch {
    // Silently fail — next request will hit Drive API directly
  }
}
