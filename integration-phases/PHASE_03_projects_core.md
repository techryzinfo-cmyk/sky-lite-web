# Phase 03 — Project Core CRUD

**Status:** ⬜ Not Started  
**Depends on:** Phase 01 (auth), Phase 02 (at least one role exists)

---

## Scope

| Area | Detail |
|------|--------|
| Frontend pages | `http://localhost:3000/projects`, `http://localhost:3000/projects/[id]` |
| API routes | `/api/projects`, `/api/projects/[id]` |
| Models | `Project`, `PlanFolder` |
| Components | `src/components/ui/CreateProjectModal.tsx`, `src/components/ui/ProjectCard.tsx`, `app/projects/page.tsx`, `app/projects/[id]/page.tsx` |

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/projects` | List all projects for org + `hasPendingPlans` flag |
| POST | `/api/projects` | Create a new project |
| GET | `/api/projects/[id]` | Get single project details |
| PATCH | `/api/projects/[id]` | Update project (status, priority, members, dates, budget) |
| DELETE | `/api/projects/[id]` | Delete project |

---

## POST `/api/projects` — Payload Reference

```json
{
  "name": "Villa Renovation",
  "description": "Location: Koregaon Park\n3BHK villa renovation",
  "clientName": "Ramesh Patil",
  "clientEmail": "ramesh@example.com",
  "clientPhone": "9876543210",
  "status": "Initialized",
  "priority": "High",
  "startDate": "2026-05-15",
  "endDate": "2026-11-15",
  "budget": 5000000,
  "needSiteSurvey": true,
  "members": ["<userId1>", "<userId2>"],
  "documents": []
}
```

**Key rules:**
- `createdBy` is always set from `req.user.id` on the server — never send it from the client
- `status` defaults to `"Initialized"` if omitted
- `priority` defaults to `"Medium"` if omitted
- Empty `startDate`/`endDate` must be sent as `undefined` (omit the key), not empty string
- `budget` initializes a `budgetHistory` entry with `reason: "Estimated Budget"`

**Valid status values:** `Initialized`, `Planning`, `In Progress`, `On Hold`, `Completed`, `Cancelled`  
**Valid priority values:** `Low`, `Medium`, `High`, `Critical`

---

## Project Workspace Tabs

When viewing `http://localhost:3000/projects/[id]`, the following tabs should be present:

| Tab | Component | Phase tested |
|-----|-----------|-------------|
| Overview | inline in page | Phase 03 |
| Milestones | `MilestonesTab` | Phase 04 |
| Timeline | `TimelineTab` | Phase 04 |
| Plans | `PlansTab` | Phase 04 |
| DPR | `DPRTab` | Phase 04 |
| BOQ | `BOQTab` | Phase 05 |
| Budget | `BudgetTab` | Phase 05 |
| Materials | `MaterialsTab` | Phase 06 |
| Issues | `IssuesTab` | Phase 07 |
| Risks | `RisksTab` | Phase 07 |
| Survey | `SurveyTab` | Phase 07 |
| Documents | `DocumentsTab` | Phase 04 |

---

## Test Scenarios

### 03-A — Create a project (no template)
1. Open `http://localhost:3000/projects`
2. Click "New Project"
3. Fill in: Name, Client Name, Priority = High, Status = Initialized
4. Set Start Date and End Date
5. Set Budget = 50,00,000
6. Toggle "Site Survey Required" ON
7. Submit
8. **Assert:** `POST /api/projects` returns `201`
9. **Assert:** Project card appears on the list
10. **Assert:** In MongoDB, `createdBy` = authenticated user's `_id`, `budgetHistory` has 1 entry

### 03-B — Create project with documents attached
1. Create a new project
2. Attach a PDF in the Documents section of the modal
3. **Assert:** Cloudinary upload succeeds (no 400 error in console)
4. **Assert:** `documents[0].status = "Approved"`, `uploadedBy.user` is set

### 03-C — Project list page
1. Open `http://localhost:3000/projects`
2. **Assert:** All projects for the org are listed
3. **Assert:** Status badge shows correct color (Initialized = gray, In Progress = blue, etc.)
4. **Assert:** `hasPendingPlans` badge shows if applicable
5. **Assert:** Search/filter by status works

### 03-D — Project list API response shape
Using browser DevTools Network tab or curl:
```
GET /api/projects
```
**Assert each project object has:**
- `_id`, `name`, `status`, `priority`
- `createdBy` = `{ _id, name, email }` (populated)
- `members` = array of `{ _id, name, email }` (populated)
- `hasPendingPlans` boolean

### 03-E — Edit a project
1. On the project card, open the 3-dot menu → Edit Project
2. Change status to "In Progress", change priority to "Critical"
3. Save
4. **Assert:** `PATCH /api/projects/[id]` returns `200`
5. **Assert:** Card updates without page reload

### 03-F — Delete a project
1. Open 3-dot menu → Delete Project
2. Confirm in dialog
3. **Assert:** `DELETE /api/projects/[id]` returns `200`
4. **Assert:** Project removed from list

### 03-G — Open project workspace
1. Click on a project card
2. **Assert:** Navigated to `/projects/[id]`
3. **Assert:** Header shows project name, client, status, priority in compact form
4. **Assert:** Tab bar is visible with underline-style active indicator
5. **Assert:** Header section is compact (not occupying excessive vertical space)

### 03-H — Project workspace header
1. Open any project
2. **Assert:** Project name is `text-base` (not oversized)
3. **Assert:** Meta row (client, dates) uses `text-[10px]`
4. **Assert:** Action buttons are `text-xs px-3 py-1.5`
5. **Assert:** Active tab shows `border-b-2 border-blue-600` (underline style, no background)

---

## Known Fixes Applied
- `createdBy` now set from `req.user.id` in POST handler (was causing 500 — field required but never sent by old frontend code)
- `priority` field added to POST handler
- Empty date strings sent as `undefined` to avoid Mongoose cast errors
- `budget` initializes `budgetHistory` array with first entry
- Project workspace header/subheader compacted to avoid excessive vertical space
- 3-dot menu on `ProjectCard` now shows Edit and Delete options

---

## Notes
- `siteSurveyor` field on the project is populated from `needSiteSurvey: true` + a later survey assignment, not at creation time
- `auditTrail` is automatically seeded with a `"Create"` action at project creation
- The `hasPendingPlans` flag is computed server-side by joining against `PlanFolder` — not stored on the project itself
