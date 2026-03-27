# Architecture — My Photos

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
│  ├─ Proxy (src/proxy.ts)                        │
│  ├─ Page Components (RSC + client islands)       │
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
                              Set-Cookie: auth-token=... (HttpOnly, SameSite=Lax)
                                     │
◄──────── { user } in JSON body ───┘   (token NOT in body — XSS-safe)

Browser: cookie sent automatically on same-origin fetch()
API routes: authenticateRequest() reads cookie first, then Authorization: Bearer (fallback)
Proxy: src/proxy.ts checks cookie presence for /my-photos, /profile (redirect to /login if absent)
Client: AuthContext keeps user in memory only; logout calls POST /api/auth/logout to clear cookie
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
  ├─ buffer read → validateImageBuffer() (magic bytes PNG/JPEG) + size guard
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
LikeButton → toggleLikeApi(photoId)
  │
lib/api.ts → POST /api/photos/[id]/like  (cookie auto-sent)
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
AuthContext.logout()  →  POST /api/auth/logout (clears cookie) + redirect as needed
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
  ├─ generateToken(userId) → JWT
  └─ NextResponse + Set-Cookie (auth-token)
  │
AuthContext.login()
  ├─ Response body: { user } only
  ├─ setUser(user)  (browser stores cookie — JS cannot read it)
  └─ no localStorage for auth token
  │
Proxy already blocks unauthenticated access to /my-photos, /profile
```

---

## 4. File Naming & Location Rules

| Layer        | Location                         | Rule                                   |
| ------------ | -------------------------------- | -------------------------------------- |
| Models       | `src/app/models/`                | PascalCase, one model per file         |
| Repositories | `src/app/repositories/`          | `*.repository.ts`                      |
| Storage      | `src/app/lib/storage/`           | `*.strategy.ts` + `storage.service.ts` |
| Auth cookie  | `src/app/lib/authCookie.ts`      | cookie name + HttpOnly options         |
| File verify  | `src/app/lib/fileValidation.ts`  | magic-byte image detection             |
| API Routes   | `src/app/api/**/route.ts`        | Next.js App Router convention          |
| Proxy        | `src/proxy.ts`                   | Route protection (cookie presence)     |
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
9. **Do not store auth JWT in localStorage** — session uses HttpOnly `auth-token` cookie set by login/register routes
10. **Image uploads** — validate with `validateImageBuffer()` (magic bytes); never trust `File.type` alone

---

_See [feature-guide.md](feature-guide.md) for step-by-step instructions to add a new feature._
