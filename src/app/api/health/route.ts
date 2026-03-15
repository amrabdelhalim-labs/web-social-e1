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
  try {
    await connectDB();

    const repos = getRepositoryManager();
    const health = await repos.healthCheck();

    let storageHealthy = false;
    try {
      const storage = getStorageService();
      storageHealthy = await storage.healthCheck();
    } catch {
      storageHealthy = false;
    }

    const allHealthy = health.status === 'healthy' && storageHealthy;

    return NextResponse.json(
      {
        status: allHealthy ? 'healthy' : 'degraded',
        database: health.database,
        repositories: health.repositories,
        storage: {
          type: getStorageType(),
          healthy: storageHealthy,
        },
        timestamp: new Date().toISOString(),
      },
      { status: allHealthy ? 200 : 503 }
    );
  } catch {
    return NextResponse.json(
      {
        status: 'error',
        database: getConnectionStatus(),
        repositories: {},
        storage: { type: getStorageType(), healthy: false },
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    );
  }
}
