/**
 * IRepository — Generic Data Access Contract
 *
 * Defines the standard CRUD interface that all repositories must implement.
 * Enforces the Repository Pattern: business logic never talks to Mongoose directly.
 *
 * All methods are async to allow transparent switching to different storage backends.
 * Entity-specific repositories extend BaseRepository and add domain operations
 * on top of this interface.
 */

import { Document, QueryFilter, QueryOptions, UpdateQuery } from 'mongoose';
import type { PaginatedResult } from '@/app/types';

export interface IRepository<T extends Document> {
  findAll(filter?: QueryFilter<T>, options?: QueryOptions<T>): Promise<T[]>;
  findOne(filter: QueryFilter<T>, options?: QueryOptions<T>): Promise<T | null>;
  findById(id: string, options?: QueryOptions<T>): Promise<T | null>;
  findPaginated(
    page: number,
    limit: number,
    filter?: QueryFilter<T>,
    options?: QueryOptions<T>
  ): Promise<PaginatedResult<T>>;
  create(data: Partial<T>): Promise<T>;
  /** Returns the updated document, or null if the id was not found */
  update(id: string, data: UpdateQuery<T>): Promise<T | null>;
  /** Bulk update — returns number of modified documents */
  updateWhere(filter: QueryFilter<T>, data: UpdateQuery<T>): Promise<number>;
  /** Returns the deleted document, or null if the id was not found */
  delete(id: string): Promise<T | null>;
  /** Bulk delete — returns number of deleted documents */
  deleteWhere(filter: QueryFilter<T>): Promise<number>;
  exists(filter: QueryFilter<T>): Promise<boolean>;
  count(filter?: QueryFilter<T>): Promise<number>;
}
