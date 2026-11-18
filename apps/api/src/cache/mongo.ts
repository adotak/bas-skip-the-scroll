import { MongoClient, Db } from 'mongodb';
import type { Session } from '@skip-the-scroll/shared';
import crypto from 'crypto';

const TTL_SECONDS = 24 * 60 * 60; // 24 hours
let cachedClient: MongoClient | null = null;
let cachedDb: Db | null = null;

// In-memory fallback if MongoDB URI is not set or fails
const memoryCache = new Map<string, { session: Session; expiresAt: number }>();

export function generateCacheKey(intent: string, mode: string, timeboxMin: number): string {
  const normalized = `${intent.trim().toLowerCase()}::${mode}::${timeboxMin}`;
  return crypto.createHash('sha256').update(normalized).digest('hex');
}

async function getMongoDb(): Promise<Db | null> {
  const uri = process.env.MONGODB_URI;
  if (!uri) return null;

  try {
    if (cachedDb) return cachedDb;
    if (!cachedClient) {
      cachedClient = new MongoClient(uri, {
        serverSelectionTimeoutMS: 2000,
      });
      await cachedClient.connect();
    }
    const db = cachedClient.db('skip_the_scroll');
    const collection = db.collection('session_cache');
    await collection.createIndex({ createdAt: 1 }, { expireAfterSeconds: TTL_SECONDS });
    await collection.createIndex({ key: 1 }, { unique: true });
    cachedDb = db;
    return cachedDb;
  } catch (err) {
    console.warn('[Cache] MongoDB connection failed, using in-memory fallback:', (err as Error).message);
    return null;
  }
}

export async function getCachedSession(key: string): Promise<Session | null> {
  const db = await getMongoDb();
  if (db) {
    try {
      const record = await db.collection('session_cache').findOne({ key });
      if (record && record.session) {
        return record.session as Session;
      }
      return null;
    } catch {
      // Fall through to memoryCache on query failure
    }
  }

  const mem = memoryCache.get(key);
  if (mem) {
    if (Date.now() < mem.expiresAt) {
      return mem.session;
    }
    memoryCache.delete(key);
  }
  return null;
}

export async function setCachedSession(key: string, session: Session): Promise<void> {
  const db = await getMongoDb();
  if (db) {
    try {
      await db.collection('session_cache').updateOne(
        { key },
        {
          $set: {
            key,
            session,
            createdAt: new Date(),
          },
        },
        { upsert: true }
      );
      return;
    } catch {
      // Fall through to memoryCache on write failure
    }
  }

  memoryCache.set(key, {
    session,
    expiresAt: Date.now() + TTL_SECONDS * 1000,
  });
}

export function clearMemoryCache(): void {
  memoryCache.clear();
}
