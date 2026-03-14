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
  update(id: string, data: UpdateQuery<T>): Promise<T | null>;
  updateWhere(filter: QueryFilter<T>, data: UpdateQuery<T>): Promise<number>;
  delete(id: string): Promise<T | null>;
  deleteWhere(filter: QueryFilter<T>): Promise<number>;
  exists(filter: QueryFilter<T>): Promise<boolean>;
  count(filter?: QueryFilter<T>): Promise<number>;
}
