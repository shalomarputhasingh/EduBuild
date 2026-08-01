# Access Control

EDUBUILD has exactly two roles: `user` and `admin`.

In product copy a `user` is called a **teacher** or **creator** — they are the people who write and publish project guides. There is no student role.

---

## Roles

### `user` (default for every new account)

| Capability | Allowed |
|---|---|
| Browse and search the approved library | yes |
| View an approved project guide | yes |
| Download a project PDF | yes |
| Leave a rating and written feedback | yes, one per project |
| Publish a new project guide | yes — enters the moderation queue as `pending` |
| View their **own** pending and rejected submissions | yes |
| Edit their own projects | yes — reverts the project to `pending` |
| Delete their own projects | yes |
| View someone else's non-approved project | **no** |
| Approve or reject anything | **no** |
| Edit or delete someone else's project | **no** |

### `admin`

Everything a `user` can do, plus:

| Capability | Allowed |
|---|---|
| View every project in any status | yes |
| Approve a pending submission | yes |
| Reject a submission | yes — **a reason is required** and shown to the creator |
| Edit or delete any project | yes |
| Publish without review | yes — admin-created projects are approved on creation |

---

## Becoming an admin

There is **no self-service path to admin.** `POST /api/auth/signup` always creates a `user`; a `role` field in the request body is ignored rather than honoured.

An operator with server access promotes an existing account:

```bash
cd backend
node scripts/promoteAdmin.js someone@example.com
```

The script requires the account to already exist, prints the change it made, and never accepts or prints a password.

> **Historical note.** Earlier versions of this project shipped a fixed default administrator account and gated admin signup behind an `ADMIN_SECRET` environment variable. Both are gone. The old gate was ineffective — when `ADMIN_SECRET` was unset it compared `undefined !== undefined`, so omitting the field entirely passed the check and granted admin. If you ever ran a build from before this change, audit `edubuild_users` for unexpected admin rows:
>
> ```sql
> SELECT id, name, email, "createdAt" FROM edubuild_users WHERE role = 'admin';
> ```

To demote an account, update it directly:

```sql
UPDATE edubuild_users SET role = 'user' WHERE email = 'someone@example.com';
```

---

## How it is enforced

Authorization is enforced on the **backend**, on every request. The frontend hides controls the current user cannot use, but that is a convenience only — the API never trusts the client's claim about who it is.

| Layer | File | Responsibility |
|---|---|---|
| Token verification | `backend/middleware/auth.js` | Rejects a request without a valid JWT; sets `req.userId` and `req.userRole` |
| Optional token | `backend/middleware/optionalAuth.js` | Populates the same fields when a token is present, but allows anonymous access |
| Admin gate | `backend/middleware/adminOnly.js` | Rejects anyone whose `req.userRole` is not `admin` |
| Ownership checks | `backend/controllers/projectController.js` | Compares `project.createdBy` against `req.userId` for edit and delete |
| Visibility filter | `backend/controllers/projectController.js` | Builds the listing `WHERE` clause from the caller's role |

Role comes from the signed JWT payload, not from anything the client sends alongside it.

### Listing visibility

| Caller | Sees |
|---|---|
| Anonymous | `status = 'approved'` only |
| `user` | approved projects, plus their own in any status |
| `admin` | everything; may filter by `?status=` |

A `user` passing `?status=pending` receives only their **own** pending projects, never anyone else's.

### Write protection

Controllers copy an explicit allowlist of fields out of the request body. `createdBy`, `rating`, `id` and the timestamps are never writable by a client, so a creator cannot reassign ownership of a project or inflate its rating by editing it.

`status` is writable only by an admin, only through `PATCH /api/projects/:id/status`, and only to `approved` or `rejected`.

---

## Auth token storage

JWTs are stored in `localStorage` and sent as a `Bearer` header. Tokens expire after 7 days by default (`JWT_EXPIRES_IN`).

This is a known interim posture: anything running in the page can read `localStorage`, so a cross-site scripting bug would expose tokens. Moving to HttpOnly `SameSite=Strict` cookies with CSRF protection is the intended next step. It is documented here rather than left implicit so the trade-off is a decision and not an accident.

Rotating `JWT_SECRET` immediately invalidates every issued token and signs all users out.
