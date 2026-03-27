/**
 * Authentication Utilities — JWT + bcrypt
 *
 * Centralizes all cryptographic operations for user authentication.
 *
 * Token format:
 *   Payload: { id: string, iat: number, exp: number }
 *   Expiry:  7 days
 *   Secret:  JWT_SECRET env var (required in production)
 *
 * Password hashing:
 *   Algorithm: bcrypt with 12 salt rounds
 *   12 rounds ≈ 300 ms per hash — balances security against brute-force and UX latency
 */

import bcrypt from 'bcryptjs';
import jwt, { SignOptions } from 'jsonwebtoken';
import type { JwtPayload } from '@/app/types';

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET && process.env.NODE_ENV === 'production') {
  throw new Error('JWT_SECRET must be set in production');
}
const JWT_SECRET_VALUE = JWT_SECRET ?? 'dev-only-insecure-secret';
const JWT_EXPIRES_IN = '7d';
const BCRYPT_SALT_ROUNDS = 12;

/** Signs a JWT containing the user's MongoDB _id + session version */
export function generateToken(userId: string, sessionVersion: number = 0): string {
  const options: SignOptions = { expiresIn: JWT_EXPIRES_IN };
  return jwt.sign({ id: userId, sv: sessionVersion }, JWT_SECRET_VALUE, options);
}

/**
 * Verifies and decodes a JWT.
 * Throws if the token is invalid, expired, or missing the `id` field.
 */
export function verifyToken(token: string): JwtPayload {
  const payload = jwt.verify(token, JWT_SECRET_VALUE) as JwtPayload;

  if (!payload?.id || typeof payload.id !== 'string') {
    throw new Error('Invalid token payload');
  }

  if (payload.sv !== undefined && (!Number.isInteger(payload.sv) || payload.sv < 0)) {
    throw new Error('Invalid token session version');
  }

  return { ...payload, sv: payload.sv ?? 0 };
}

/** Hashes a plain-text password with bcrypt (12 rounds) */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_SALT_ROUNDS);
}

/** Compares a plain-text password against a stored bcrypt hash */
export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
