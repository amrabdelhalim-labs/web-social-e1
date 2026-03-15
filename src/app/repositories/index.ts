/**
 * RepositoryManager — Centralized Repository Access
 *
 * Provides a single access point for all repositories via lazy-loaded singleton getters.
 * Use getRepositoryManager() to obtain an instance; calling the getter multiple times
 * always returns the same RepositoryManager instance.
 *
 * healthCheck() runs COUNT queries against each collection to confirm DB connectivity
 * and is exposed by GET /api/health.
 *
 * Usage:
 *   const repos = getRepositoryManager();
 *   const user  = await repos.user.findById(id);
 *   const photos = await repos.photo.findPublicFeed(1, 12);
 */

import mongoose from 'mongoose';
import { getLikeRepository, LikeRepository } from './like.repository';
import { getPhotoRepository, PhotoRepository } from './photo.repository';
import { getUserRepository, UserRepository } from './user.repository';

class RepositoryManager {
  get user(): UserRepository {
    return getUserRepository();
  }

  get photo(): PhotoRepository {
    return getPhotoRepository();
  }

  get like(): LikeRepository {
    return getLikeRepository();
  }

  /**
   * Probes each repository with a lightweight COUNT query.
   * Returns { status, database, repositories } — used by the health endpoint.
   */
  async healthCheck(): Promise<{
    status: string;
    database: string;
    repositories: Record<string, boolean>;
  }> {
    const dbState = mongoose.connection.readyState;
    const dbStatus = dbState === 1 ? 'connected' : dbState === 2 ? 'connecting' : 'disconnected';
    const repositories: Record<string, boolean> = {};

    try {
      await this.user.count();
      repositories.user = true;
    } catch {
      repositories.user = false;
    }

    try {
      await this.photo.count();
      repositories.photo = true;
    } catch {
      repositories.photo = false;
    }

    try {
      await this.like.count();
      repositories.like = true;
    } catch {
      repositories.like = false;
    }

    const allHealthy = Object.values(repositories).every(Boolean);
    return {
      status: allHealthy ? 'healthy' : 'degraded',
      database: dbStatus,
      repositories,
    };
  }
}

let instance: RepositoryManager | null = null;

/** Returns the singleton RepositoryManager instance */
export function getRepositoryManager(): RepositoryManager {
  if (!instance) instance = new RepositoryManager();
  return instance;
}

export { RepositoryManager };
