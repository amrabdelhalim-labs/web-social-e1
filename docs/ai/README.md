# My Photos (صوري) — AI Assistant Reference

> Read this file first before changing code.

## Project scope

This repository is self-contained:

- No PWA/service worker/offline push stack.
- No runtime dependency on other repositories.
- Docker-based deployment is supported (local Compose + GHCR workflow).
- Heroku deployment remains supported via documented env vars.

## Project identity

| Field      | Value                                            |
| ---------- | ------------------------------------------------ |
| Name       | My Photos (صوري)                                 |
| Type       | Full-Stack SSR (Next.js App Router)              |
| Stack      | Next.js 16, TypeScript, MongoDB, Mongoose, MUI 7 |
| Version    | v0.1.3 (see README changelog)                    |
| Tests      | 35 test files (Vitest + Testing Library)         |
| Deployment | Docker (Compose/GHCR) + Heroku                   |
| Node       | >= 20.x, npm >= 10.x                             |

## Critical rules

1. Never import models directly in API routes; use repository factories (`getRepositoryManager()` or specific getters).
2. Never use `process.env` in UI components; keep app constants in `src/app/config.ts`.
3. Never call `useContext()` directly in components; use `useAuth()` and `useThemeMode()`.
4. Always validate API input and return Arabic end-user error messages.
5. Keep commit messages in English, following Conventional Commits.
6. Always route media operations through the storage service (photos + avatars).
7. Keep cascade deletes complete: photo delete removes likes + file, account delete removes user data + files.
8. Keep CI quality gates green before image publish (`format:check`, `lint`, `typecheck`, `test`, `docker:check`, `build`).
9. Camera flows must go through `useCamera` (no external camera SDKs).
10. Theme context must keep Emotion `CacheProvider` (not `AppRouterCacheProvider`).
11. Do not use git trailer flags such as `--trailer "Made-with: Cursor"` in commits.
12. Auth session is **HttpOnly cookie** (`auth-token`); `lib/api.ts` does not inject `Authorization` — same-origin `fetch` sends the cookie. `authenticateRequest` accepts cookie or Bearer fallback.
13. Home page (`src/app/page.tsx`) is a **Server Component** fetching the first feed page from DB; interactive pagination lives in `HomePageFeed.tsx`.

## Core map

| Path                              | Purpose                                                    |
| --------------------------------- | ---------------------------------------------------------- |
| `src/app/config.ts`               | Central constants (size limits, camera values, app labels) |
| `src/app/types.ts`                | Shared TypeScript contracts                                |
| `src/app/providers.tsx`           | Provider tree: Theme -> Auth                               |
| `src/app/context/AuthContext.tsx` | user session in memory; cookie-based auth (no token in JS) |
| `src/proxy.ts`                    | Route protection for `/my-photos`, `/profile`              |
| `src/app/lib/authCookie.ts`       | HttpOnly session cookie options                            |
| `src/app/lib/fileValidation.ts`   | server-side image magic-byte checks                        |
| `src/app/lib/photoSerializer.ts`  | shared photo JSON shape (API + RSC)                        |
| `src/app/hooks/useCamera.ts`      | camera capture flow + fallback                             |
| `src/app/lib/api.ts`              | centralized HTTP API client                                |
| `src/app/lib/storage/`            | storage strategy implementations                           |
| `src/app/repositories/`           | repository pattern data access                             |
| `src/app/api/`                    | API routes (auth, photos, profile, health)                 |
| `src/app/tests/`                  | unit/component/page/config tests                           |

## Quick start

```bash
# local dev
cp .env.example .env.local
npm install
npm run db:init
npm run dev
```

```bash
# local docker stack
cp .env.docker.example .env
docker compose up --build
```

## CI and release notes

- Docker workflow file: `.github/workflows/docker-publish.yml` (runs on SemVer tags `v*` or `workflow_dispatch`; optional `publish` flag for GHCR push).
- Image publish target: `ghcr.io/<owner>/<repo>` (lowercased repository path).
- After the `quality` job passes, the `docker` job runs Trivy **filesystem** scan and **image** scan (`web-social-e1:scan`); both steps set `trivyignores: '.trivyignore'`. Versioned CVE policy and `exp:` review dates live in `.trivyignore` (Alpine/zlib and Next.js `dist/compiled` vendored deps are not fully addressed by npm `overrides` alone).

## Live API integration check

```bash
node scripts/test-api.mjs https://<your-host>
```

The script checks `/api/health`, auth/profile/photos endpoints, upload flows, and cleanup behavior. It mirrors the browser by reading **`Set-Cookie: auth-token`** from register/login and sending **`Cookie: auth-token=...`** on subsequent requests (same as production cookie sessions).

## Related AI docs

- [`architecture.md`](architecture.md): layer diagram, flows, and architectural rules.
- [`feature-guide.md`](feature-guide.md): end-to-end workflow for adding new entities/features.
