import { Document, Types } from 'mongoose';

// ─── Client-Side Types (JSON-serializable) ──────────────────────────────────

export interface User {
  _id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Photo {
  _id: string;
  title: string;
  description?: string;
  imageUrl: string;
  user: Pick<User, '_id' | 'name' | 'avatarUrl'>;
  likesCount: number;
  isLiked?: boolean;
  createdAt: string;
  updatedAt: string;
}

// ─── Server-Side Types (Mongoose Documents) ─────────────────────────────────

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  avatarUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface IPhoto extends Document {
  title: string;
  description?: string;
  imageUrl: string;
  user: Types.ObjectId | IUser;
  likesCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ILike extends Document {
  user: Types.ObjectId | IUser;
  photo: Types.ObjectId | IPhoto;
  createdAt: Date;
}

// ─── API Types ──────────────────────────────────────────────────────────────

export interface ApiError {
  code: string;
  message: string;
}

export interface ApiResponse<T> {
  data?: T;
  message?: string;
  error?: ApiError;
}

export interface PaginatedResult<T> {
  rows: T[];
  count: number;
  page: number;
  totalPages: number;
}

export interface PaginatedApiResponse<T> {
  data: T[];
  pagination: {
    page: number;
    totalPages: number;
    total: number;
    limit: number;
  };
}

// ─── Auth Types ─────────────────────────────────────────────────────────────

export interface JwtPayload {
  id: string;
  iat?: number;
  exp?: number;
}

// ─── Input Types ────────────────────────────────────────────────────────────

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface UpdateUserInput {
  name?: string;
  email?: string;
}

export interface ChangePasswordInput {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface PhotoInput {
  title: string;
  description?: string;
}

export interface UpdatePhotoInput {
  title?: string;
  description?: string;
}

// ─── Storage Types ──────────────────────────────────────────────────────────

export interface UploadResult {
  url: string;
  filename: string;
  publicId?: string;
}

export interface StorageFile {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
  size: number;
}

// ─── Camera Types ────────────────────────────────────────────────────────────

export type CameraPermission = 'granted' | 'denied' | 'prompt' | 'unsupported';

export interface CameraState {
  isSupported: boolean;
  isActive: boolean;
  hasPermission: CameraPermission;
  error: string | null;
}
