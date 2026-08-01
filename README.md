# EDUBUILD

A project-sharing platform for low-cost classroom STEM activities.

Teachers publish practical project guides — materials, costs, steps, images, tutorial videos, safety notes, learning outcomes and downloadable documentation. Anyone can browse, search and use them for classroom activities. Admins moderate submissions before they become public.

---

## Stack

| Layer | Technology |
|---|---|
| Framework | **Next.js 16** (App Router), React 19 |
| Styling | Tailwind CSS |
| API | Next.js route handlers (`app/api/**`) — same process, same origin |
| Database | **Supabase PostgreSQL** |
| ORM | Sequelize (models and queries only — schema is owned by SQL migrations) |
| Auth | JWT (HS256) Bearer tokens, bcrypt password hashing |
| AI | Pluggable provider: Gemini, OpenAI, Groq, or OpenRouter |
| Video | YouTube oEmbed (no API key required) |
| Scanner | TensorFlow.js + MobileNet, loaded on demand in the browser |

> This project does **not** use MongoDB. Older documents describing a MongoDB or Google Sheets architecture are archived under [`docs/legacy/`](docs/legacy/) for historical reference only.

---

## Project structure

The client and the API are one Next.js application on one port. There is no separate backend server and no dev proxy.

```
edubuild/
├── app/                      # Next.js App Router
│   ├── layout.jsx            # Root layout, fonts, providers
│   ├── providers.jsx         # Auth / Language / Toast context boundary
│   ├── globals.css           # Tailwind layers + design primitives
│   ├── page.jsx              # Home, and one folder per route below
│   ├── projects/  project/[id]/  submit/  dashboard/
│   ├── assistant/  scanner/  signin/  signup/  admin/
│   └── api/                  # Route handlers — the entire HTTP API
│       ├── auth/  projects/  feedback/  ai/  youtube/  health/
│       └── [...notFound]/    # JSON 404 for unmatched /api paths
├── lib/                      # Server-side code
│   ├── config/               # env loader, Sequelize connection
│   ├── api/                  # auth, validation, rate limits, error shaping
│   ├── models/               # Sequelize models
│   ├── schemas/              # zod request schemas
│   ├── services/
│   │   ├── ai/               # Provider abstraction
│   │   └── youtube/          # URL parsing + oEmbed
│   └── utils/                # crypto, project normalisation
├── src/                      # Client components
│   ├── views/                # One component per page
│   ├── components/           # layout, project, forms, admin, ai, common
│   ├── hooks/  context/  services/  utils/
├── scripts/                  # Operator CLIs (promoteAdmin, dev helpers)
├── test/                     # node:test unit tests
├── supabase/
│   ├── migrations/           # Versioned SQL — the schema source of truth
│   └── seed.sql              # Sample project data
└── docs/legacy/              # Archived, historically inaccurate documents
```

> `src/views/` is deliberately not named `src/pages/`: Next reserves a top-level
> `pages/` directory for the older Pages Router, and having both makes the build
> fail.

---

## Getting started

### Prerequisites

- Node.js 18 or newer
- A [Supabase](https://supabase.com) project (the free tier is sufficient)
- The [Supabase CLI](https://supabase.com/docs/guides/cli) for applying migrations

### 1. Database

Create a Supabase project, then copy the **connection string** from
*Project Settings → Database → Connection string → URI*.

Use the **session pooler on port 5432** for a normal long-running Node server.
Use the transaction pooler on port 6543 only if you deploy to a serverless platform.

Apply the schema:

```bash
npx supabase link --project-ref <your-project-ref>
npm run db:diff          # review the pending changes first
npm run db:push
```

### 2. Configure and run

```bash
npm ci
cp .env.example .env.local
# Fill in DATABASE_URL, JWT_SECRET and (optionally) one AI provider key
npm run dev
```

Runs on **`http://localhost:3000`** — client and API together.

Generate the two secrets with:

```bash
openssl rand -base64 48   # JWT_SECRET
openssl rand -base64 32   # SETTINGS_ENCRYPTION_KEY
```

`.env.local` is gitignored. Never commit it.

### 3. Create your first admin

Every signup creates a regular `user` account — there is no self-service route to admin.
Register through the UI, then promote yourself:

```bash
npm run promote-admin -- you@example.com
```

---

## Roles

The platform has exactly two roles.

| Role | Can |
|---|---|
| `user` | Browse and search the library, view guides, download PDFs, leave feedback, **publish their own project guides**, and track their submissions' approval status. |
| `admin` | Everything a user can, plus: review the moderation queue, approve or reject submissions with a reason, and edit or delete any project. |

In product copy a `user` is referred to as a **teacher** or **creator** — they are the people writing and publishing guides. There is no separate student role.

Projects created by an admin are published immediately. Projects created by a user enter the queue as `pending`, and editing an approved project returns it to `pending` for re-review.

---

## Environment variables

All of these live in `.env.local`, which is gitignored. Next loads it automatically.

None of them are `NEXT_PUBLIC_`-prefixed, so none reach the browser: an accidental
import of server config into a client component fails the build rather than
leaking a key.

| Variable | Required | Notes |
|---|---|---|
| `NODE_ENV` | no | Set by `next dev` / `next build` |
| `PORT` | no | Defaults to `3000` |
| `CLIENT_URL` | in production | CORS allowlist, for a separate client calling this API. Same-origin requests do not need it. |
| `DATABASE_URL` | yes\* | Supabase pooled connection string |
| `SUPABASE_DB_HOST` / `_PORT` / `_NAME` / `_USER` / `_PASSWORD` | yes\* | Alternative to `DATABASE_URL` |
| `JWT_SECRET` | yes | Minimum 32 characters in production |
| `JWT_EXPIRES_IN` | no | Defaults to `7d` |
| `SETTINGS_ENCRYPTION_KEY` | to configure keys in the UI | A 32-byte base64 or hex secret. Generate with `openssl rand -base64 32`; keep it stable so saved provider keys remain decryptable. |
| `AI_PROVIDER` | no | `gemini` \| `openai` \| `groq` \| `openrouter` \| `mock`. Defaults to `gemini`. |
| `GEMINI_API_KEY` / `OPENAI_API_KEY` / `GROQ_API_KEY` / `OPENROUTER_API_KEY` | one of | Only the selected provider's key is needed |
| `GEMINI_MODEL` / `OPENAI_MODEL` / `GROQ_MODEL` / `OPENROUTER_MODEL` | no | Sensible defaults per provider |
| `AI_TIMEOUT_MS` | no | Defaults to `20000` |
| `YOUTUBE_API_KEY` | no | Only for the optional video *search* feature. Embedding needs no key. |

\* Provide either `DATABASE_URL` or the complete discrete set.

In production a missing required variable **throws at startup**, naming the
variable but never its value.

### Client-visible variables

| Variable | Notes |
|---|---|
| `NEXT_PUBLIC_API_URL` | Optional. Defaults to `/api` — same origin, so it is normally unset. |

**Never put an API key in a `NEXT_PUBLIC_` variable.** Anything with that prefix
is inlined into the public JavaScript bundle and readable by every visitor. All
provider keys are server-only, and every AI call goes through a route handler.

---

## API

### Auth
| Method | Path | Auth | Notes |
|---|---|---|---|
| `POST` | `/api/auth/signup` | — | Always creates a `user`. A `role` in the body is ignored. |
| `POST` | `/api/auth/signin` | — | |
| `GET` | `/api/auth/profile` | user | |

### Projects
| Method | Path | Auth | Notes |
|---|---|---|---|
| `GET` | `/api/projects` | optional | Filtered, sorted, paginated. See below. |
| `GET` | `/api/projects/:id` | optional | |
| `GET` | `/api/projects/:id/related` | optional | Up to 4 similar projects |
| `GET` | `/api/projects/recommended` | user | Scored against the user's preferences |
| `POST` | `/api/projects` | user | |
| `PUT` | `/api/projects/:id` | creator or admin | |
| `PATCH` | `/api/projects/:id/status` | admin | Rejection requires a reason |
| `DELETE` | `/api/projects/:id` | creator or admin | |

**Listing query parameters**

```
GET /api/projects?search=&budgetMin=&budgetMax=&classLevel=&subject=
    &material=&difficulty=&status=&tag=&page=1&limit=12&sort=newest
```

`sort` is one of `newest`, `oldest`, `budget_asc`, `budget_desc`, `rating_desc`, `title_asc`. `limit` is capped at 50.

The response carries pagination metadata:

```json
{ "data": [], "page": 1, "limit": 12, "total": 137, "totalPages": 12 }
```

Visibility follows the caller: anonymous requests see approved projects only; a signed-in user additionally sees their own pending and rejected submissions; admins see everything.

### Feedback
| Method | Path | Auth | Notes |
|---|---|---|---|
| `POST` | `/api/feedback` | user | One rating per user per project |
| `GET` | `/api/feedback/project/:projectId` | — | |

### YouTube
| Method | Path | Auth | Notes |
|---|---|---|---|
| `POST` | `/api/youtube/preview` | user | Body `{ url }` → normalized metadata via oEmbed |

### AI
| Method | Path | Auth | Notes |
|---|---|---|---|
| `POST` | `/api/ai/chat` | user | Multi-turn, rate-limited |
| `POST` | `/api/ai/project-help` | user | Explains a specific project |

---

## Feature notes

### YouTube video embedding

A teacher pastes a YouTube URL when submitting or editing a project. The server validates the host, extracts the video ID, and calls YouTube's public **oEmbed** endpoint to fetch the title, channel and thumbnail. **This requires no API key and has no quota cost.**

If oEmbed is unreachable the URL is still accepted and saved — the preview is simply limited to a derived thumbnail. Video pages embed through `youtube-nocookie.com` behind a click-to-load thumbnail, so no YouTube script loads unless a visitor actually plays the video. A "Watch on YouTube" link is always offered as a fallback.

Automatic video *search* (suggesting tutorials for a project) is designed but not enabled. It requires a `YOUTUBE_API_KEY`, costs 100 quota units per search against a 10,000/day default, and would always present candidates for a human to choose from rather than attaching one automatically. The endpoint returns `501` while unconfigured.

### AI assistant

All four providers implement one interface, selected by `AI_PROVIDER`. Gemini and OpenAI use their official SDKs; Groq and OpenRouter are OpenAI-compatible and reuse the OpenAI client with a different `baseURL`, so no extra dependencies are involved.

If the selected provider's key is missing, the API returns a clear `503` in production. In development it falls back to a canned mock provider so the UI stays usable offline.

Requests are authenticated, rate-limited and length-capped, and every call carries a 20-second timeout. Keys are never sent to the browser and never appear in logs or error responses.

To enable real replies, choose one provider in `.env.local`, set that provider's key, and restart the server. Alternatively, set a stable `SETTINGS_ENCRYPTION_KEY`, sign in as an admin, and add/test the provider key in **AI Settings**; the key is verified before it is saved. Do not use `mock` in production.

### Material scanner

`/scanner` uses **MobileNet**, a general-purpose image classifier trained on everyday objects. It is *not* a purpose-built waste or materials classifier, so treat its output as a starting suggestion — the UI always lets you correct the detected category before searching.

TensorFlow.js and the model weights (~17 MB) download **only after you press "Start Scanner"**, never on page load, and the browser caches them afterwards. Camera access requires HTTPS or localhost; image upload works as a fallback when a camera is unavailable or permission is denied.

---

## Development

```bash
npm run dev            # Next dev server — client + API on :3000
npm run build          # Production build
npm start              # Serve the production build
npm test               # node:test unit tests

npm run db:diff        # Review pending migrations
npm run db:push        # Apply them
npm run db:lint
```

---

## Deployment

1. Provision the Supabase project and run `npm run db:push`.
2. Set every required environment variable on the host. Do not copy `.env.local` between machines.
3. `npm run build && npm start` — one process serves the client and the API.
4. Run `npm run promote-admin -- <email>` once to create the first admin.

Because the client and the API share an origin, there is no proxy to configure
and no CORS to satisfy in a standard deployment.

### Authentication caveat

JWTs are currently stored in `localStorage`, which leaves them readable by any script running on the page. This is acceptable for the current stage but is **not a final production posture**. Moving to HttpOnly, `SameSite=Strict` cookies with CSRF protection is the intended next step and is tracked as follow-up work.

---

## Security

- No secrets are committed. `.env.local` is git-ignored; only `.env.example` placeholders are tracked.
- All provider API keys are server-only and never reach the client. Keys saved through the admin UI are encrypted at rest with AES-256-GCM and are only ever returned masked.
- Passwords are hashed with bcrypt.
- A Content-Security-Policy and the other security headers are set in `next.config.mjs`. Fonts are self-hosted via `next/font`, so no third-party font host is permitted.
- Per-route rate limiting and zod request validation are applied across the API.
- The database schema is changed only through reviewed migrations; the server never alters it at runtime.

If you find a security issue, please open an issue without including the details of any credential involved.
