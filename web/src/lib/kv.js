import { store } from './store';

const MAX_THREADS = 50;
const MAX_MESSAGES_PER_THREAD = 20;

function threadKey(email) {
  return `threads:${email}`;
}

export async function getThreads(email) {
  try {
    const data = await store.get(threadKey(email));
    return Array.isArray(data) ? data : [];
  } catch (err) {
    console.error('[kv] getThreads error:', err);
    return [];
  }
}

export async function saveThreads(email, threads) {
  try {
    const trimmed = threads.slice(0, MAX_THREADS).map(t => ({
      ...t,
      messages: t.messages.slice(-MAX_MESSAGES_PER_THREAD),
    }));
    await store.set(threadKey(email), trimmed);
  } catch (err) {
    console.error('[kv] saveThreads error:', err);
  }
}
