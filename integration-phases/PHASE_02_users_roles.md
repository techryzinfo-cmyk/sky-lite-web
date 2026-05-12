# Phase 02 — Users & Roles / Permissions

**Status:** ⬜ Not Started  
**Depends on:** Phase 01 (need an authenticated Admin account)

---

## Scope

| Area | Detail |
|------|--------|
| Frontend pages | `http://localhost:3000/users` |
| API routes | `/api/roles`, `/api/roles/[id]`, `/api/users`, `/api/users/[id]` |
| Models | `Role`, `User` |
| Components | `src/components/users/RoleList.tsx`, `RoleModal.tsx`, `UserList.tsx`, `UserModal.tsx` |

---

## API Endpoints

### Roles

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/roles` | List all roles for the org |
| POST | `/api/roles` | Create a new role |
| GET | `/api/roles/[id]` | Get single role |
| PATCH | `/api/roles/[id]` | Update role name/permissions |
| DELETE | `/api/roles/[id]` | Delete role (non-system roles only) |

**Role payload:**
```json
{
  "name": "Site Engineer",
  "permissions": ["projects:view", "workprogress:view", "workprogress:create", "site:view"]
}
```
Permissions are stored as flat string array. The UI converts to/from a nested object (`{ projects: { view: true } }`).

### Users

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users` | List all users in the org |
| POST | `/api/users` | Invite/create a new user |
| GET | `/api/users/[id]` | Get single user |
| PATCH | `/api/users/[id]` | Update user (name, mobile, role, projects) |
| DELETE | `/api/users/[id]` | Delete user |

**User create payload:**
```json
{
  "name": "John Doe",
  "email": "john@test.com",
  "mobile": "9876543210",
  "role": "<roleId>",
  "projectIds": ["<projectId1>"]
}
```

---

## Permission Modules (15 total)

| Module ID | Title |
|-----------|-------|
| `projects` | Project Management |
| `financials` | Financials & Payments |
| `inventory` | Inventory & Assets |
| `team` | User & Team Mgmt |
| `site` | Site Operations |
| `plans` | Plan Management |
| `annotations` | Plan Annotations |
| `sitesurvey` | Site Survey Management |
| `budget` | Budget Management |
| `land` | Land Documents Mgmt |
| `boq` | BOQ Management |
| `tasks` | Task Management |
| `workprogress` | Work Progress |
| `snag` | Snag Management |
| `escalation` | Escalation Matrix |

**Actions per module:** `view`, `create`, `update`, `delete`, `approve`, `complete`

---

## Test Scenarios

### 02-A — View Roles tab
1. Open `http://localhost:3000/users` → Roles tab
2. **Assert:** Admin role visible with a lock icon (cannot be edited/deleted)
3. **Assert:** Permissions badge or count shown

### 02-B — Create a new Role
1. Click "Create Role"
2. Name: `"Site Engineer"`
3. Toggle on: `projects:view`, `workprogress:view`, `workprogress:create`
4. Save
5. **Assert:** `POST /api/roles` returns `201`
6. **Assert:** New role appears in list
7. **Assert:** In MongoDB, `permissions` array = `["projects:view", "workprogress:view", "workprogress:create"]`

### 02-C — Edit a Role
1. Click edit on `Site Engineer`
2. Add `workprogress:delete`, remove `workprogress:create`
3. Save
4. **Assert:** `PATCH /api/roles/[id]` returns `200`
5. **Assert:** Role permissions updated in list

### 02-D — All 15 modules visible in RoleModal
1. Open any role for editing
2. **Assert:** All 15 module cards are visible (scroll through the modal)
3. **Assert:** Each module has 6 action toggles (view, create, update, delete, approve, complete)
4. **Assert:** "Grant All" preset works — all toggles turn on
5. **Assert:** "View Only" preset — only `view` toggles on for all modules

### 02-E — Admin role is locked
1. Try to edit the Admin role
2. **Assert:** All toggles are disabled / modal shows lock state
3. **Assert:** Cannot delete Admin role

### 02-F — Create a new User
1. Switch to Users tab, click "Add User"
2. Fill in: Name, Email, Mobile (10 digits), select `Site Engineer` role, select a project
3. Submit
4. **Assert:** `POST /api/users` returns `201`
5. **Assert:** User appears in list with correct role pill
6. **Assert:** Mobile number shows in user card

### 02-G — Edit User (role + projects)
1. Click edit on the user created above
2. Change role to a different one
3. Add another project
4. Save
5. **Assert:** User card reflects updated role

### 02-H — Delete User
1. Delete the test user
2. **Assert:** `DELETE /api/users/[id]` returns `200`
3. **Assert:** User removed from list

### 02-I — Permission enforcement (login as limited user)
1. Log out of Admin
2. Log in as the `Site Engineer` user
3. Navigate to `/users`
4. **Assert:** Role management UI is hidden or shows "No permission"
5. Navigate to `/projects` — should be accessible (has `projects:view`)

---

## Known Fixes Applied
- RoleModal rewritten to show all 15 modules × 6 actions (was showing only 4 modules)
- UserModal rewritten with mobile field, role pills, and projects multi-select
- Permission format conversion: flat array `['projects:view']` ↔ nested `{ projects: { view: true } }`
- Admin role locked when `role.name.toLowerCase().includes('admin')`

---

## Notes
- Deleting a user does not cascade-delete their work. Audit trails keep `userName` as string.
- `phoneNumber` in `User` model validates 10-digit format `/^[0-9]{10}$/`
- `*` wildcard in role permissions = full access to all modules
