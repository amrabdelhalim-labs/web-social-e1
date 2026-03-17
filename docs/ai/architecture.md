# Architecture — صوري

> Detailed layer map, patterns, and data flows. Read before modifying core files.

---

## 1. Layer Diagram

```text
┌─────────────────────────────────────────────────┐
│                  Browser (Client)                │
│  React Components  ←→  Context (Auth, Theme)    │
│  Custom Hooks (usePhotos, useCamera, …)          │
│  lib/api.ts  ←─── all HTTP calls                │
└────────────────────┬────────────────────────────┘
                     │  HTTP (fetch)
┌────────────────────▼────────────────────────────┐
│              Next.js App Router (Server)         │
│  ├─ Page Components (SSR)                        │
│  └─ API Routes  (src/app/api/**/route.ts)        │
│       │                                          │
│       ├─► authenticateRequest()  (JWT verify)    │
│       ├─► validateXxxInput()     (input guard)   │
│       ├─► Repositories           (data layer)    │
│       └─► StorageService         (file layer)    │
└─────────────┬───────────────┬───────────────────┘
              │               │
    ┌─────────▼───┐   ┌───────▼────────┐
    │  MongoDB     │   │ Storage Backend │
    │  (Mongoose)  │   │ local /        │
    │  User        │   │ Cloudinary /   │
    │  Photo       │   │ S3             │
    │  Like        │   └────────────────┘
    └─────────────┘
```

---

## 2. Key Architectural Patterns

### 2.1 Repository Pattern

All DB access goes through repositories — never import Mongoose models directly in API routes.

```text
API Route
  └─► getPhotoRepository()           ← factory function
        └─► PhotoRepository           ← extends BaseRepository<PhotoDoc>
              └─► mongoose.Model      ← only touched inside repository
```

| File                                   | Role                                              |
| -------------------------------------- | ------------------------------------------------- |
| `repositories/repository.interface.ts` | `IRepository<T>` contract                         |
| `repositories/base.repository.ts`      | Generic Mongoose implementation                   |
| `repositories/user.repository.ts`      | `findByEmail`, `emailExists`, `deleteUserCascade` |
| `repositories/photo.repository.ts`     | `findPublicFeed`, `updateLikesCount`              |
| `repositories/like.repository.ts`      | `toggleLike`, `getLikeStatus`                     |
| `repositories/index.ts`                | `getRepositoryManager()` singleton                |

### 2.2 Storage Strategy Pattern

Storage backend is selected at runtime via `STORAGE_TYPE` env var. All upload/delete operations use the same `IStorageStrategy` interface.

```text
getStorageService()
  ├─ STORAGE_TYPE=local      → LocalStorageStrategy  (public/uploads/)
  ├─ STORAGE_TYPE=cloudinary → CloudinaryStorageStrategy
  └─ STORAGE_TYPE=s3         → S3StorageStrategy
```

The storage singleton is module-level. `resetStorageService()` exists for tests.

### 2.3 Auth Flow

```text
Client  ──POST /api/auth/login──►  API Route
                                     │
                              validateLoginInput()
                                     │
                              userRepo.findByEmail()
                                     │
                              comparePassword() (bcrypt)
                                     │
                              generateToken() (JWT)
                                     │
◄──────── { token, user } ───────────┘

Token storage: localStorage  (AuthContext manages it)
Token usage:   Authorization: Bearer <token>  on every protected request
```

### 2.4 Context Architecture

```text
providers.tsx
  └─ ThemeProvider (MUI + Emotion CacheProvider)
       └─ AuthProvider
            └─ {children}   ← all pages and layouts

useAuth()       ← reads AuthContext (never useContext directly)
useThemeMode()  ← reads ThemeContext
```

---

## 3. Data Flows

### 3.1 Upload Photo

```text
User selects file (or captures from camera)
  │
PhotoUploadForm (client)
  │  FormData: { title, description, photo }
  │
useMyPhotos.upload()
  │
lib/api.ts → POST /api/photos (multipart)
  │
API Route:
  ├─ authenticateRequest()         → userId
  ├─ validatePhotoInput()          → errors?
  ├─ file type + size guard
  ├─ getStorageService().uploadFile()  → { url }
  ├─ photoRepo.create({ title, description, imageUrl: url, user: userId })
  └─ NextResponse.json({ data: photo })
  │
PhotoGrid re-renders with new photo
```

### 3.2 Toggle Like

```text
User clicks LikeButton
  │
LikeButton → usePhotos.toggleLike(photoId)
  │
lib/api.ts → POST /api/photos/[id]/like
  │
API Route:
  ├─ authenticateRequest()
  ├─ photoRepo.findById(photoId)   → exists?
  ├─ likeRepo.toggleLike(userId, photoId)  → { liked }
  ├─ photoRepo.updateLikesCount(photoId, delta)
  └─ NextResponse.json({ data: { liked, likesCount } })
  │
LikeButton updates count + icon optimistically
```

### 3.3 Delete Account (Cascade)

```text
User confirms password in DeleteAccountDialog
  │
lib/api.ts → DELETE /api/profile  { password }
  │
API Route:
  ├─ authenticateRequest()
  ├─ userRepo.findById()       → foundUser
  ├─ comparePassword()         → match?
  ├─ photoRepo.findAll({ user })  → all user photos
  ├─ collect filesToDelete = [imageUrls…, avatarUrl]
  ├─ userRepo.deleteUserCascade()
  │     └─ deletes: User + Photos + Likes (in one transaction-safe sequence)
  └─ storage.deleteFiles(filesToDelete)   → cleanup storage
  │
AuthContext.logout()  →  redirect to /login
```

### 3.4 User Login

```text
User submits login form
  │
login/page.tsx → lib/api.ts → POST /api/auth/login
  │
API Route:
  ├─ validateLoginInput()
  ├─ userRepo.findByEmail()
  ├─ comparePassword()
  └─ generateToken(userId) → JWT
  │
AuthContext.login(token)
  ├─ localStorage.setItem('token', token)
  ├─ decodeToken()  → userId
  ├─ GET /api/auth/me  → user object
  └─ setUser(user)
  │
ProtectedRoute redirects to /
```

---

## 4. File Naming & Location Rules

| Layer        | Location                         | Rule                                   |
| ------------ | -------------------------------- | -------------------------------------- |
| Models       | `src/app/models/`                | PascalCase, one model per file         |
| Repositories | `src/app/repositories/`          | `*.repository.ts`                      |
| Storage      | `src/app/lib/storage/`           | `*.strategy.ts` + `storage.service.ts` |
| API Routes   | `src/app/api/**/route.ts`        | Next.js App Router convention          |
| Components   | `src/app/components/<category>/` | PascalCase                             |
| Hooks        | `src/app/hooks/`                 | `use*.ts`                              |
| Contexts     | `src/app/context/`               | `*Context.tsx`                         |
| Types        | `src/app/types.ts`               | single file for all shared types       |
| Config       | `src/app/config.ts`              | single file for all constants          |

---

## 5. Critical Rules for AI Modifications

1. **Never import models directly** in API routes — use `getUserRepository()`, `getPhotoRepository()`, `getLikeRepository()`
2. **Never use `process.env` in components** — use constants from `config.ts`
3. **Never use `useContext()` directly** — use `useAuth()` or `useThemeMode()`
4. **Always validate inputs** in API routes before DB access
5. **Storage cleanup on failure** — if upload succeeds but DB write fails, delete the uploaded file
6. **Cascade on delete** — photo delete removes likes + file; account delete removes all photos + likes + files
7. **ThemeContext uses Emotion `CacheProvider`** — not `AppRouterCacheProvider` (avoids Webpack/Turbopack conflict)
8. **Run with Webpack** (`next dev --webpack`) — avoids Turbopack issues with MUI

---

_See [feature-guide.md](feature-guide.md) for step-by-step instructions to add a new feature._
