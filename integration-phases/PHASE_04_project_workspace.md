# Phase 04 — Project Workspace: Plans, Milestones, DPR, Documents

**Status:** ⬜ Not Started  
**Depends on:** Phase 03 (need at least one project)

---

## Scope

| Area | Detail |
|------|--------|
| Frontend pages | `http://localhost:3000/projects/[id]` — tabs: Milestones, Timeline, Plans, DPR, Documents |
| API routes | `/api/projects/[id]/milestones`, `/api/projects/[id]/milestones/[milestoneId]`, `/api/projects/[id]/work-progress`, `/api/projects/[id]/work-progress/summary`, `/api/projects/[id]/folders`, `/api/projects/[id]/folders/[folderId]`, `/api/projects/[id]/folders/[folderId]/annotations`, `/api/projects/[id]/documents`, `/api/projects/[id]/documents/[docId]/action`, `/api/projects/[id]/plan-approvers` |
| Models | `Milestone`, `WorkProgress`, `PlanFolder` |
| Components | `src/components/project/MilestonesTab.tsx`, `TimelineTab.tsx`, `PlansTab.tsx`, `DPRTab.tsx`, `DPRModal.tsx`, `DocumentsTab.tsx`, `DocumentViewer.tsx`, `PlanRoom.tsx` |

---

## API Endpoints

### Milestones

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/projects/[id]/milestones` | List milestones |
| POST | `/api/projects/[id]/milestones` | Create milestone |
| GET | `/api/projects/[id]/milestones/[milestoneId]` | Get single milestone |
| PATCH | `/api/projects/[id]/milestones/[milestoneId]` | Update milestone (name, dates, status, tasks) |
| DELETE | `/api/projects/[id]/milestones/[milestoneId]` | Delete milestone |

**Milestone payload:**
```json
{
  "name": "Foundation Work",
  "startDate": "2026-05-15",
  "endDate": "2026-06-15",
  "description": "Foundation and excavation phase"
}
```

**Milestone status values:** `Pending`, `In Progress`, `Completed`, `Delayed`

---

### Work Progress / DPR

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/projects/[id]/work-progress?period=week` | List progress logs (period: today/week/month) |
| POST | `/api/projects/[id]/work-progress` | Log site progress with photos |
| DELETE | `/api/projects/[id]/work-progress?logId=xxx` | Delete a log |
| GET | `/api/projects/[id]/work-progress/summary` | Aggregated progress summary |

**Work Progress POST payload:**
```json
{
  "milestoneId": "<optional>",
  "milestoneName": "Foundation Work",
  "description": "Completed concrete pouring for column bases",
  "progressPercent": 35,
  "photos": ["https://res.cloudinary.com/..."],
  "date": "2026-05-12"
}
```
> **Note:** `progressPercent` must be 1–100. Fixed bug: was hardcoded to 0, now reads from body with fallback to 1.

---

### Plan Folders & Documents

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/projects/[id]/folders` | List all plan folders |
| POST | `/api/projects/[id]/folders` | Create folder |
| GET | `/api/projects/[id]/folders/[folderId]` | Get folder with documents |
| PATCH | `/api/projects/[id]/folders/[folderId]` | Update folder / add documents |
| DELETE | `/api/projects/[id]/folders/[folderId]` | Delete folder |
| GET | `/api/projects/[id]/documents` | List all documents across project |
| POST | `/api/projects/[id]/documents/[docId]/action` | Approve / Reject a document |
| GET | `/api/projects/[id]/plan-approvers` | List plan approvers |
| POST | `/api/projects/[id]/plan-approvers` | Add plan approver |

### Annotations

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/projects/[id]/folders/[folderId]/annotations` | List annotations on a plan |
| POST | `/api/projects/[id]/folders/[folderId]/annotations` | Add annotation |

---

## Test Scenarios

### 04-A — Milestones tab
1. Open project → Milestones tab
2. **Assert:** Empty state shown if no milestones
3. Create a milestone: "Foundation Work", dates 2026-05-15 → 2026-06-15
4. **Assert:** `POST /api/projects/[id]/milestones` returns `201`
5. **Assert:** Milestone card appears with correct dates and status badge

### 04-B — Update milestone status
1. Click on milestone → Edit or status dropdown
2. Change status to "In Progress"
3. **Assert:** `PATCH /api/projects/[id]/milestones/[milestoneId]` returns `200`

### 04-C — Timeline tab
1. Open project → Timeline tab
2. **Assert:** Milestones render as timeline bars / Gantt entries
3. **Assert:** Date ranges visible and correctly mapped

### 04-D — DPR tab — Log work progress
1. Open project → DPR tab
2. Click "Log Progress" / "Add Entry"
3. Fill: Description (min 1 char), upload at least 1 site photo, select milestone, set progress %
4. **Assert:** Photo uploads to Cloudinary without 400 error
5. Submit
6. **Assert:** `POST /api/projects/[id]/work-progress` returns `201`
7. **Assert:** New entry appears in DPR list with photo thumbnail, date, description

### 04-E — DPR period filter
1. Change period filter (Today / Week / Month)
2. **Assert:** API called with correct `?period=` param
3. **Assert:** List updates accordingly

### 04-F — DPR without photo (validation)
1. Try to submit a DPR entry without uploading a photo
2. **Assert:** Server returns `400` with `"At least one site photo is required"`
3. **Assert:** UI shows error, no entry created

### 04-G — Plans tab — Create folder
1. Open project → Plans tab
2. Create a folder: "Architectural Plans"
3. **Assert:** `POST /api/projects/[id]/folders` returns `201`
4. **Assert:** Folder appears in list

### 04-H — Plans tab — Upload plan document
1. Open folder → Upload a PDF plan document
2. **Assert:** Cloudinary upload succeeds
3. **Assert:** Document listed inside folder with name, size, upload date

### 04-I — Document approval workflow
1. Open a document with `status: "Pending"` approvals
2. Click Approve
3. **Assert:** `POST /api/projects/[id]/documents/[docId]/action` with `{ action: "Approve" }`
4. **Assert:** Document status updates to `"Approved"` in UI
5. **Assert:** `hasPendingPlans` flag on project should change if no more pending

### 04-J — Plan annotations (PlanRoom)
1. Open a plan document in PlanRoom / DocumentViewer
2. Add an annotation (pin or comment on the plan)
3. **Assert:** `POST /api/projects/[id]/folders/[folderId]/annotations` returns `201`
4. **Assert:** Annotation visible on the plan

### 04-K — Documents tab
1. Open project → Documents tab
2. **Assert:** Lists all documents across all folders
3. **Assert:** Upload a general project document — Cloudinary works, document saved

---

## Known Fixes Applied
- `DPRModal`: Fixed `uploadToCloudinary(file, 'ml_default')` → `uploadToCloudinary(file)` (second arg removed after upload.ts rewrite)
- `WorkProgress` route: `progressPercent: 0` replaced with `body.progressPercent || 1` to pass `min: 1` model validation

---

## Notes
- `hasPendingPlans` on the project list is computed from `PlanFolder.documents[].approvals` — re-fetch project list after approving all plans to see the flag clear
- Plan annotations are stored as sub-documents on `PlanFolder`, not a separate collection
- DPR = Daily Progress Report — maps to `WorkProgress` model
