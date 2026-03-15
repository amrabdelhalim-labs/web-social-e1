/**
 * GET  /api/health — Returns application, database, and storage health status.
 * HEAD /api/health — Lightweight connectivity probe.
 */

import { NextResponse } from 'next/server';
import { connectDB, getConnectionStatus } from '@/app/lib/mongodb';
import { getRepositoryManager } from '@/app/repositories';
import { getStorageService, getStorageType } from '@/app/lib/storage/storage.service';

export async function HEAD(): Promise<NextResponse> {
  return new NextResponse(null, { status: 200 });
}

export async function GET(): Promise<NextResponse> {
  let dbError: string | null = null;
  let storageHealthy = false;
  let storageError: string | null = null;

  // 1. Try database connection
  try {
    await connectDB();
  } catch (err) {
    dbError = err instanceof Error ? err.message : String(err);
  }

  // 2. Check storage independently (even if DB failed)
  try {
    const storage = getStorageService();
    storageHealthy = await storage.healthCheck();
  } catch (err) {
    storageError = err instanceof Error ? err.message : String(err);
  }

  // 3. Repository health (only if DB connected)
  type HealthResult = { status: string; database: string; repositories: Record<string, boolean> };
  let health: HealthResult = { status: 'error', database: 'disconnected', repositories: {} };
  if (!dbError) {
    try {
      const repos = getRepositoryManager();
      health = await repos.healthCheck();
    } catch {
      health = { status: 'degraded', database: getConnectionStatus(), repositories: {} };
    }
  }

  const allHealthy = !dbError && health.status === 'healthy' && storageHealthy;

  return NextResponse.json(
    {
      status: allHealthy ? 'healthy' : 'degraded',
      database: dbError ? 'error' : health.database,
      databaseError: dbError ?? undefined,
      repositories: health.repositories,
      storage: {
        type: getStorageType(),
        healthy: storageHealthy,
        error: storageError ?? undefined,
      },
      timestamp: new Date().toISOString(),
    },
    { status: allHealthy ? 200 : 503 }
  );
}
