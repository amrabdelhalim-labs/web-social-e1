/**
 * POST /api/auth/register
 *
 * Creates a new user account and returns a JWT token with user data.
 *
 * Body: { name, email, password, confirmPassword }
 * Response: { data: { token, user }, message }
 */

import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/app/lib/mongodb';
import { hashPassword, generateToken } from '@/app/lib/auth';
import { getUserRepository } from '@/app/repositories/user.repository';
import { validateRegisterInput } from '@/app/validators';
import { validationError, conflictError, serverError } from '@/app/lib/apiErrors';
import type { User } from '@/app/types';

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();

    const errors = validateRegisterInput(body);
    if (errors.length > 0) return validationError(errors);

    await connectDB();
    const userRepo = getUserRepository();

    const emailTaken = await userRepo.emailExists(body.email);
    if (emailTaken) return conflictError('البريد الإلكتروني مُسجّل مسبقًا.');

    const hashedPassword = await hashPassword(body.password);

    const newUser = await userRepo.create({
      name: body.name.trim(),
      email: body.email.trim().toLowerCase(),
      password: hashedPassword,
    });

    const token = generateToken(newUser._id.toString());

    const user: User = {
      _id: newUser._id.toString(),
      name: newUser.name,
      email: newUser.email,
      avatarUrl: newUser.avatarUrl,
      createdAt: newUser.createdAt.toISOString(),
      updatedAt: newUser.updatedAt.toISOString(),
    };

    return NextResponse.json(
      { data: { token, user }, message: 'تم إنشاء الحساب بنجاح.' },
      { status: 201 }
    );
  } catch (error) {
    console.error('Register error:', error);
    return serverError();
  }
}
