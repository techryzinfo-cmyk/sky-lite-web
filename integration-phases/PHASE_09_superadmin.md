# Phase 09 — Super Admin

**Status:** ⬜ Not Started  
**Depends on:** Nothing — separate auth from org-level admin

---

## Scope

| Area | Detail |
|------|--------|
| Frontend pages | `http://localhost:3001/superadmin/login`, `http://localhost:3001/superadmin/dashboard` |
| API routes | `POST /api/superadmin/auth/login`, `POST /api/superadmin/auth/logout`, `GET /api/superadmin/admins` |
| Auth | Separate JWT — cookie `superadmin_token`; middleware `withSuperAdmin` validates it |

---

## Super Admin vs Org Admin

| | Org Admin | Super Admin |
|--|-----------|-------------|
| Auth route | `POST /api/auth/login` | `POST /api/superadmin/auth/login` |
| Scope | One org | All orgs on platform |
| Data access | Own org's projects/users | All orgs, all users (read-only aggregates) |
| Cookie | `token` | `superadmin_token` |

---

## API Endpoints

### `POST /api/superadmin/auth/login`
```json
{ "email": "superadmin@platform.com", "password": "SuperSecretPwd" }
```
**Response `200`:** `{ "token": "<jwt>" }` — stored in `superadmin_token` cookie.

### `POST /api/superadmin/auth/logout`
Clears `superadmin_token` cookie.

### `GET /api/superadmin/admins`
Returns all orgs with their admin details and stats:
```json
[
  {
    "orgId": "...",
    "orgName": "Test Admin's Workspace",
    "createdAt": "...",
    "admin": { "name": "Test Admin", "email": "...", "status": "active" },
    "stats": { "userCount": 3, "projectCount": 5, "templateCount": 2 }
  }
]
```

---

## Test Scenarios

### 09-A — Super Admin Login
1. Navigate to `http://localhost:3001/superadmin/login`
2. Enter super admin credentials
3. **Assert:** Redirected to `/superadmin/dashboard`
4. **Assert:** `superadmin_token` cookie set

### 09-B — Dashboard — Platform Stats
1. On dashboard, **Assert:** Total orgs, users, and projects shown
2. **Assert:** Each org row shows admin name, user count, project count

### 09-C — Org Detail View
1. Click on an org row (if detail view exists)
2. **Assert:** Org's users and projects listed

### 09-D — Super Admin Logout
1. Click logout
2. **Assert:** `superadmin_token` cookie cleared
3. **Assert:** Redirected to `/superadmin/login`

### 09-E — Protected route guard
1. Clear `superadmin_token` cookie
2. Navigate to `/superadmin/dashboard`
3. **Assert:** Redirected to `/superadmin/login`

---

## Known Observations

| Item | Notes |
|------|-------|
| Super admin credentials | Seeded separately — check `.env` or seed script |
| `withSuperAdmin` middleware | Separate from `withAuth` — uses different JWT secret |
| No org-level actions | Super admin is read-only dashboard, no CRUD on orgs |
