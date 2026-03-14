import { Document, Model, QueryFilter, QueryOptions, UpdateQuery } from 'mongoose';
import { MAX_PAGE_SIZE } from '@/app/config';
import type { PaginatedResult } from '@/app/types';
import type { IRepository } from './repository.interface';

export class BaseRepository<T extends Document> implements IRepository<T> {
  protected model: Model<T>;

  constructor(model: Model<T>) {
    this.model = model;
  }

  getModel(): Model<T> {
    return this.model;
  }

  async findAll(
    filter: QueryFilter<T> = {} as QueryFilter<T>,
    options: QueryOptions<T> = {}
  ): Promise<T[]> {
    return this.model.find(filter, null, options);
  }

  async findOne(filter: QueryFilter<T>, options: QueryOptions<T> = {}): Promise<T | null> {
    return this.model.findOne(filter, null, options);
  }

  async findById(id: string, options: QueryOptions<T> = {}): Promise<T | null> {
    return this.model.findById(id, null, options);
  }

  async findPaginated(
    page: number = 1,
    limit: number = 10,
    filter: QueryFilter<T> = {} as QueryFilter<T>,
    options: QueryOptions<T> = {}
  ): Promise<PaginatedResult<T>> {
    const safePage = Math.max(1, page);
    const safeLimit = Math.min(Math.max(1, limit), MAX_PAGE_SIZE);
    const skip = (safePage - 1) * safeLimit;

    const [rows, count] = await Promise.all([
      this.model.find(filter, null, { ...options, skip, limit: safeLimit }),
      this.model.countDocuments(filter),
    ]);

    return {
      rows,
      count,
      page: safePage,
      totalPages: Math.max(1, Math.ceil(count / safeLimit)),
    };
  }

  async create(data: Partial<T>): Promise<T> {
    const doc = new this.model(data);
    return doc.save();
  }

  async update(id: string, data: UpdateQuery<T>): Promise<T | null> {
    return this.model.findByIdAndUpdate(id, data, { returnDocument: 'after' });
  }

  async updateWhere(filter: QueryFilter<T>, data: UpdateQuery<T>): Promise<number> {
    const result = await this.model.updateMany(filter, data);
    return result.modifiedCount;
  }

  async delete(id: string): Promise<T | null> {
    return this.model.findByIdAndDelete(id);
  }

  async deleteWhere(filter: QueryFilter<T>): Promise<number> {
    const result = await this.model.deleteMany(filter);
    return result.deletedCount;
  }

  async exists(filter: QueryFilter<T>): Promise<boolean> {
    const result = await this.model.exists(filter);
    return result !== null;
  }

  async count(filter: QueryFilter<T> = {} as QueryFilter<T>): Promise<number> {
    return this.model.countDocuments(filter);
  }
}
