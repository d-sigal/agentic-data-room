/**
 * KV store abstraction.
 * Uses ioredis with REDIS_URL — works with both:
 *   - Local Redis (docker-compose)
 *   - Upstash Redis (production)
 *
 * Without REDIS_URL the store falls back to an in-process memory map. That is
 * fine for a local demo (sessions and threads vanish on restart) and wrong
 * for production, where every instance needs the same view.
 */

import Redis from 'ioredis';

let _redis = null;
let _warned = false;

class MemoryStore {
  constructor() { this.kv = new Map(); this.sets = new Map(); }
  _live(key) {
    const e = this.kv.get(key);
    if (!e) return null;
    if (e.exp && e.exp < Date.now()) { this.kv.delete(key); return null; }
    return e;
  }
  async set(key, value, mode, ttl) { this.kv.set(key, { v: value, exp: mode === 'EX' ? Date.now() + ttl * 1000 : null }); return 'OK'; }
  async get(key) { const e = this._live(key); return e ? e.v : null; }
  async del(key) { return this.kv.delete(key) ? 1 : 0; }
  async sadd(key, ...m) { const s = this.sets.get(key) || new Set(); m.forEach(x => s.add(x)); this.sets.set(key, s); return m.length; }
  async srem(key, ...m) { const s = this.sets.get(key); if (!s) return 0; m.forEach(x => s.delete(x)); return m.length; }
  async sismember(key, m) { return this.sets.get(key)?.has(m) ? 1 : 0; }
}

function getRedis() {
  if (!_redis) {
    if (!process.env.REDIS_URL) {
      if (!_warned) {
        _warned = true;
        console.warn('[store] REDIS_URL not set: using in-memory store (local demo only).');
      }
      _redis = globalThis.__memoryStore ||= new MemoryStore();
    } else {
      _redis = new Redis(process.env.REDIS_URL, {
        maxRetriesPerRequest: null,
        lazyConnect: true,
      });
    }
  }
  return _redis;
}

export const store = {
  async set(key, value, opts) {
    const client = getRedis();
    if (opts?.ex) {
      return client.set(key, JSON.stringify(value), 'EX', opts.ex);
    }
    return client.set(key, JSON.stringify(value));
  },

  async get(key) {
    const client = getRedis();
    const val = await client.get(key);
    if (val === null) return null;
    try {
      return JSON.parse(val);
    } catch {
      return val;
    }
  },

  async del(key) {
    const client = getRedis();
    return client.del(key);
  },

  async sadd(key, ...members) {
    const client = getRedis();
    return client.sadd(key, ...members);
  },

  async srem(key, ...members) {
    const client = getRedis();
    return client.srem(key, ...members);
  },

  async sismember(key, member) {
    const client = getRedis();
    return client.sismember(key, member);
  },
};
