# Feature Guide — صوري

> Step-by-step instructions for adding a new entity or feature to the project.
> Follow this guide in order — skipping layers causes bugs.

---

## Adding a New Entity (Full CRUD Example)

The steps below use a hypothetical `Comment` entity as an example.
Replace `Comment` / `comment` with your actual entity name.

---

### Step 1 — Define the TypeScript Type (`src/app/types.ts`)

Add the shared interface that all layers will use.

```typescript
// src/app/types.ts
export interface Comment {
  _id: string;
  body: string;
  photo: string;       // photo._id
  user: {
    _id: string;
    name: string;
    avatarUrl: string | null;
  };
  createdAt: string;
  updatedAt: string;
}
```

---

### Step 2 — Create the Mongoose Model (`src/app/models/Comment.ts`)

```typescript
import mongoose, { Schema, Document } from 'mongoose';

export interface CommentDoc extends Document {
  body: string;
  photo: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const CommentSchema = new Schema<CommentDoc>(
  {
    body: { type: String, required: true, maxlength: 500 },
    photo: { type: Schema.Types.ObjectId, ref: 'Photo', required: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

// Index for fast per-photo retrieval
CommentSchema.index({ photo: 1, createdAt: -1 });

export const CommentModel =
  mongoose.models.Comment ?? mongoose.model<CommentDoc>('Comment', CommentSchema);
```

---

### Step 3 — Create the Repository (`src/app/repositories/comment.repository.ts`)

```typescript
import { BaseRepository } from './base.repository';
import { CommentModel, CommentDoc } from '../models/Comment';

class CommentRepository extends BaseRepository<CommentDoc> {
  constructor() {
    super(CommentModel);
  }

  /** Get all comments for a photo, newest last */
  async findByPhoto(photoId: string): Promise<CommentDoc[]> {
    return this.model
      .find({ photo: photoId })
      .populate('user', 'name avatarUrl')
      .sort({ createdAt: 1 })
      .lean();
  }

  /** Delete all comments for a photo (used in photo cascade delete) */
  async deleteByPhoto(photoId: string): Promise<void> {
    await this.model.deleteMany({ photo: photoId });
  }
}

let instance: CommentRepository | null = null;

export function getCommentRepository(): CommentRepository {
  if (!instance) instance = new CommentRepository();
  return instance;
}
```

---

### Step 4 — Add Validation (`src/app/validators/index.ts`)

```typescript
export function validateCommentInput(body: unknown): string[] {
  const errors: string[] = [];
  const data = body as Record<string, unknown>;

  if (!data.body || typeof data.body !== 'string' || data.body.trim().length === 0) {
    errors.push('نص التعليق مطلوب.');
  }
  if (typeof data.body === 'string' && data.body.length > 500) {
    errors.push('التعليق لا يتجاوز 500 حرف.');
  }

  return errors;
}
```

---

### Step 5 — Create the API Routes (`src/app/api/comments/route.ts`)

```typescript
/**
 * GET  /api/comments?photoId=xxx — List comments for a photo
 * POST /api/comments              — Add a comment (auth required)
 */
import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/app/lib/mongodb';
import { authenticateRequest } from '@/app/middlewares/auth.middleware';
import { getCommentRepository } from '@/app/repositories/comment.repository';
import { validateCommentInput } from '@/app/validators';
import { validationError, serverError } from '@/app/lib/apiErrors';

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const photoId = request.nextUrl.searchParams.get('photoId');
    if (!photoId) return validationError(['photoId مطلوب.']);

    await connectDB();
    const commentRepo = getCommentRepository();
    const comments = await commentRepo.findByPhoto(photoId);
    return NextResponse.json({ data: comments }, { status: 200 });
  } catch (error) {
    console.error('Comments list error:', error);
    return serverError();
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const auth = authenticateRequest(request);
    if (auth.error) return auth.error;

    const body = await request.json();
    const errors = validateCommentInput(body);
    if (errors.length > 0) return validationError(errors);

    await connectDB();
    const commentRepo = getCommentRepository();
    const comment = await commentRepo.create({
      body: body.body.trim(),
      photo: body.photoId,
      user: auth.userId,
    } as never);

    return NextResponse.json({ data: comment, message: 'تم إضافة التعليق.' }, { status: 201 });
  } catch (error) {
    console.error('Comment create error:', error);
    return serverError();
  }
}
```

---

### Step 6 — Add the API Client Function (`src/app/lib/api.ts`)

```typescript
export async function getComments(photoId: string): Promise<Comment[]> {
  return request<Comment[]>(`/api/comments?photoId=${photoId}`);
}

export async function addComment(photoId: string, body: string): Promise<Comment> {
  return request<Comment>('/api/comments', {
    method: 'POST',
    body: JSON.stringify({ photoId, body }),
  });
}
```

---

### Step 7 — Create the Custom Hook (`src/app/hooks/useComments.ts`)

```typescript
import { useState, useEffect, useCallback } from 'react';
import { getComments, addComment } from '@/app/lib/api';
import type { Comment } from '@/app/types';

export function useComments(photoId: string) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    getComments(photoId)
      .then(setComments)
      .finally(() => setLoading(false));
  }, [photoId]);

  const addNewComment = useCallback(
    async (body: string) => {
      const comment = await addComment(photoId, body);
      setComments((prev) => [...prev, comment]);
    },
    [photoId]
  );

  return { comments, loading, addNewComment };
}
```

---

### Step 8 — Create the UI Component (`src/app/components/photos/CommentSection.tsx`)

Build the component using MUI, consume `useComments()`, and wire up the form.
Follow the existing component patterns (RTL, `sx` prop, Arabic labels).

---

### Step 9 — Update Cascade Deletes

If your entity belongs to a photo, update the photo delete route to clean it up:

```typescript
// src/app/api/photos/[id]/route.ts — inside DELETE handler
import { getCommentRepository } from '@/app/repositories/comment.repository';

// After likeRepo.deleteWhere({ photo: photo._id })
const commentRepo = getCommentRepository();
await commentRepo.deleteByPhoto(id);
```

If it belongs to a user, update `userRepo.deleteUserCascade()` accordingly.

---

### Step 10 — Write the Tests (`src/app/tests/useComments.test.ts`)

```typescript
import { renderHook, act } from '@testing-library/react';
import { useComments } from '../hooks/useComments';
import * as api from '../lib/api';

vi.mock('../lib/api');

describe('useComments', () => {
  it('loads comments on mount', async () => {
    vi.mocked(api.getComments).mockResolvedValue([
      { _id: '1', body: 'great photo', photo: 'p1', user: { _id: 'u1', name: 'Ali', avatarUrl: null }, createdAt: '', updatedAt: '' },
    ]);
    const { result } = renderHook(() => useComments('p1'));
    await act(async () => {});
    expect(result.current.comments).toHaveLength(1);
  });
});
```

---

## Adding a Simple Feature (No New Entity)

If the feature doesn't require a new DB collection:

1. **UI only** → create component → add to page
2. **New API endpoint** → add `route.ts` → update `lib/api.ts` → create/update hook → update component
3. **Config constant** → add to `config.ts` (never hardcode values in components)
4. **New env variable** → add to `.env.example` + `docs/deployment.md`

---

## Checklist Before Submitting

- [ ] TypeScript type added to `types.ts`
- [ ] Mongoose model has correct indexes
- [ ] Repository extends `BaseRepository` — no raw Mongoose in API routes
- [ ] Validation function returns Arabic error messages
- [ ] API route calls `authenticateRequest()` for protected endpoints
- [ ] Storage cleanup on failure (if feature involves file upload)
- [ ] Cascade delete updated if entity belongs to photo or user
- [ ] `lib/api.ts` has the client function
- [ ] Custom hook isolates all API calls
- [ ] Component uses `sx` prop, RTL-safe, WCAG AA contrast
- [ ] Tests written and passing
- [ ] Commit follows Conventional Commits format

---

*See [architecture.md](architecture.md) for the full layer diagram and data flow examples.*
