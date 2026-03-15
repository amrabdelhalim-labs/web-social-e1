/**
 * MongoDB Connection Manager
 *
 * Provides a cached Mongoose connection that survives Next.js Hot Module Replacement
 * in development and is reused across serverless function invocations in production.
 *
 * The connection is stored in globalThis to persist across HMR cycles. In production
 * (serverless), each function instance maintains its own connection pool.
 *
 * Supported URI env vars (checked in order):
 *   DATABASE_URL — primary (matches Heroku Postgres naming convention)
 *   MONGODB_URI  — common alternative
 *   DB_URL       — fallback
 *
 * serverSelectionTimeoutMS is set to 5 s to fail fast during health checks
 * rather than hanging for the default 30 s.
 */

import mongoose from 'mongoose';

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  var __mongoose: MongooseCache | undefined;
}

const cached: MongooseCache = globalThis.__mongoose ?? { conn: null, promise: null };
if (!globalThis.__mongoose) globalThis.__mongoose = cached;

function getMongoUri(): string {
  const uri = process.env.DATABASE_URL || process.env.MONGODB_URI || process.env.DB_URL;
  if (!uri) {
    throw new Error('Database URL is missing. Set DATABASE_URL or MONGODB_URI or DB_URL.');
  }
  return uri;
}

/**
 * Returns a cached Mongoose connection, creating one on the first call.
 * Safe to call on every API route invocation — subsequent calls are near-instant.
 */
export async function connectDB(): Promise<typeof mongoose> {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose.connect(getMongoUri(), {
      bufferCommands: false,
      serverSelectionTimeoutMS: 5000,
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (error) {
    // Clear the failed promise so the next call retries
    cached.promise = null;
    throw error;
  }

  return cached.conn;
}

/** Returns a human-readable string of the current Mongoose connection state */
export function getConnectionStatus(): string {
  const state = mongoose.connection.readyState;
  const stateMap: Record<number, string> = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  };
  return stateMap[state] ?? 'unknown';
}
