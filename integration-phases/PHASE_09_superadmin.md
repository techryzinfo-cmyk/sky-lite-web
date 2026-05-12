# Phase 09 — Super Admin

**Status:** ⬜ Not Started  
**Depends on:** Phase 01–08 (need orgs/users created to verify admin views)

---

## Scope

| Area | Detail |
|------|--------|
| Frontend pages | `http://localhost:3000/superadmin/login`, `http://localhost:3000/superadmin/dashboard` |
| API routes | `/api/superadmin/auth/login`, `/api/superadmin/auth/logout`, `/api/superadmin/admins` |
| Models | `SuperAdmin`, `Organization`, `User` |
| Components | Super admin dashboard page components |

---

## API Endpoints

### Super Admin Auth

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/superadmin/auth/login` | Super admin login (separate from org login) |
| POST | `/api/superadmin/auth/logout` | Super admin logout |

**Super admin login payload:**
```json
{ "email": "superadmin@skylite.com", "password": "<superadmin-password>" }
```

> Super admin credentials are seeded separately — they are NOT created via the regular `/api/auth/register` flow. Check the API's seed script or `.env` for initial super admin credentials.

---

### Admin Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/superadmin/admins` | List all organization admins / orgs |
| POST | `/api/superadmin/admins` | Create a new org admin |

---

## Test Scenarios

### 09-A — Super admin login
1. Open `http://localhost:3000/superadmin/login`
2. Enter super admin credentials
3. **Assert:** Redirected to `/superadmin/dashboard`
4. **Assert:** Regular org cookie NOT present (separate auth context)

### 09-B — Super admin dashboard
1. Open `http://localhost:3000/superadmin/dashboard`
2. **Assert:** Platform statistics visible:
   - Total organizations
   - Total users
   - Total projects
   - Active subscriptions (if applicable)
3. **Assert:** List of all organizations with admin names

### 09-C — Super admin cannot access regular routes
1. While logged in as super admin, navigate to `http://localhost:3000/projects`
2. **Assert:** Redirected (super admin is not an org user)

### 09-D — Regular admin cannot access super admin routes
1. While logged in as a regular org admin, navigate to `http://localhost:3000/superadmin/dashboard`
2. **Assert:** Redirected to `/superadmin/login` or shows 403

### 09-E — Org admin list
1. On super admin dashboard, view the list of all orgs
2. **Assert:** Each org shows: organization name, admin name, admin email, project count, user count
3. **Assert:** Org created in Phase 01 is visible

### 09-F — Create a new org admin (optional)
1. Click "Add Organization Admin"
2. Fill in name, email, password
3. **Assert:** `POST /api/superadmin/admins` returns `201`
4. **Assert:** New org + admin role + user created (same as register flow)
5. **Assert:** New org visible in the admin list

### 09-G — Super admin logout
1. Click logout from super admin dashboard
2. **Assert:** Redirected to `/superadmin/login`
3. **Assert:** Super admin cookie cleared

---

## Notes
- Super admin is a completely separate auth system from regular org users
- The `SuperAdmin` model is independent of `User` and `Organization`
- Super admin JWT has a different payload/secret (check API `.env` for `SUPERADMIN_JWT_SECRET` or similar)
- Super admin cannot perform project-level operations — it's a platform management role only
- If the super admin feature is not yet implemented in the web frontend, document that here and skip to a direct API test using curl/Postman
