# EDUBUILD Backend

Express (ESM) API for the EDUBUILD platform, backed by **Supabase PostgreSQL** through Sequelize.

For product overview, roles, and the full API reference, see the [root README](../README.md).

---

## Quick start

```bash
npm ci
cp .env.example .env      # fill in DATABASE_URL, JWT_SECRET, CLIENT_URL
npx supabase db push      # apply migrations from ../supabase/migrations
npm run dev               # node --watch on :5000
```

Create your first admin after signing up through the UI:

```bash
node scripts/promoteAdmin.js you@example.com
```

---

## Layout

```
backend/
├── config/
│   ├── env.js             # Validates and exports environment config; fails fast in production
│   └── db.js              # Sequelize instance for Supabase. Never calls sync().
├── controllers/           # Request handlers — thin, no business logic in routes
├── routes/                # Express routers; wires middleware + validation per endpoint
├── middleware/
│   ├── auth.js            # Requires a valid JWT
│   ├── optionalAuth.js    # Populates identity when present, allows anonymous
│   ├── adminOnly.js       # Requires role === 'admin'
│   ├── validate.js        # zod schema → 400 with field-keyed errors
│   ├── rateLimits.js      # Per-route express-rate-limit instances
│   └── errorHandler.js    # Central error formatting; hides internals in production
├── models/                # Sequelize model definitions and associations
├── schemas/               # zod request schemas
├── services/
│   ├── ai/                # Provider abstraction (gemini, openai, groq, openrouter, mock)
│   ├── youtube/           # URL parsing and keyless oEmbed lookup
│   └── recommendation.js  # Project scoring
├── utils/
│   └── normalizeProject.js # Legacy ⇄ structured materials/steps conversion
├── scripts/
│   ├── promoteAdmin.js    # Operator CLI: grant or revoke admin
│   └── dev/               # Local-only helpers (never run against production)
└── test/                  # node:test unit tests
```

---

## Database

The schema lives in [`../supabase/migrations/`](../supabase/migrations/) as versioned SQL and is applied with the Supabase CLI.

**`sequelize.sync()` is never called.** The running server cannot alter the hosted schema — that would make production drift silently and would be unreviewable. Sequelize is used only as a query builder and model layer, so any model change must be paired with a migration.

```bash
npx supabase db push --dry-run   # review the diff
npx supabase db push             # apply
npx supabase db lint
node scripts/dev/dbStatus.js     # connectivity + row counts
```

### Connection

Set either `DATABASE_URL` (the pooled Supabase URI) or the discrete `SUPABASE_DB_*` variables. SSL is required and configured with `rejectUnauthorized: false`, which is Supabase's documented setting — the connection is still encrypted, but Supabase's certificate chain is not in Node's default trust store.

Use the **session pooler (port 5432)** for this long-running server. The transaction pooler (6543) is for serverless deployments and does not support session-level features Sequelize relies on.

---

## Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | `node --watch server.js` |
| `npm start` | Production start |
| `npm test` | `node --test test/` |
| `node scripts/promoteAdmin.js <email>` | Grant admin |
| `node scripts/promoteAdmin.js <email> --demote` | Revoke admin |
| `node scripts/dev/dbStatus.js` | Connectivity and row counts |
| `node scripts/dev/seedDevUsers.js` | Local test accounts with generated passwords |

---

## Security posture

- **Environment.** `config/env.js` validates required variables at boot and exits in production if any is missing, naming the variable but never printing a value.
- **Headers.** `helmet` on every response.
- **CORS.** Origin allowlist from `CLIENT_URL`. The server refuses to start in production if it is unset, rather than falling through to a permissive default.
- **Rate limiting.** A global limiter plus tighter per-route limits on auth, AI, YouTube preview, and project writes.
- **Validation.** Every route body, query and param is parsed by a zod schema before reaching a controller.
- **Mass assignment.** Controllers copy an explicit allowlist of fields. `createdBy`, `rating`, `id` and timestamps are never client-writable.
- **Passwords.** bcrypt, hashed in a model hook so a plaintext password never reaches the database layer.
- **Errors.** The central handler logs full detail server-side and returns only a safe message in production.
- **Secrets.** AI provider keys are read on the backend only and never included in a response, a log line, or an error body.

### Known interim decisions

JWTs live in `localStorage` on the client rather than an HttpOnly cookie. Documented in [ACCESS_CONTROL.md](../ACCESS_CONTROL.md); moving to cookies with CSRF protection is planned follow-up work.
