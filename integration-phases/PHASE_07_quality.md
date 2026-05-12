# Phase 07 — Quality Control: Issues, Risks, Snags, Site Survey

**Status:** ⬜ Not Started  
**Depends on:** Phase 03 (need a project), Phase 02 (users for assignment)

---

## Scope

| Area | Detail |
|------|--------|
| Frontend pages | `http://localhost:3000/projects/[id]` — tabs: Issues, Risks, Survey |
| API routes | `/api/projects/[id]/issues`, `/api/issues/[id]`, `/api/projects/[id]/risks`, `/api/risks/[id]`, `/api/projects/[id]/snags`, `/api/snags/[id]`, `/api/projects/[id]/survey`, `/api/projects/[id]/escalation-matrix` |
| Models | `Issue`, `Risk`, `Snag`, `SiteSurvey`, `EscalationMatrix` |
| Components | `src/components/project/IssuesTab.tsx`, `IssueModal.tsx`, `IssueDetailModal.tsx`, `RisksTab.tsx`, `RiskModal.tsx`, `RiskDetailModal.tsx`, `SurveyTab.tsx`, `SurveyModal.tsx`, `SurveyDetailModal.tsx`, `EscalationMatrixModal.tsx` |

---

## API Endpoints

### Issues

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/projects/[id]/issues` | List project issues |
| POST | `/api/projects/[id]/issues` | Create issue |
| GET | `/api/issues/[id]` | Get single issue (with comments, attachments) |
| PATCH | `/api/issues/[id]` | Update issue (status, assignee, priority) |
| DELETE | `/api/issues/[id]` | Delete issue |

**Issue payload:**
```json
{
  "title": "Crack in column C4",
  "description": "Vertical crack observed in column C4 on 2nd floor",
  "priority": "High",
  "category": "Structural",
  "assignedTo": "<userId>",
  "dueDate": "2026-05-20",
  "attachments": ["https://res.cloudinary.com/..."]
}
```

**Issue status values:** `Open`, `In Progress`, `Resolved`, `Closed`  
**Issue priority values:** `Low`, `Medium`, `High`, `Critical`

---

### Risks

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/projects/[id]/risks` | List project risks |
| POST | `/api/projects/[id]/risks` | Create risk |
| GET | `/api/risks/[id]` | Get single risk |
| PATCH | `/api/risks/[id]` | Update risk |
| DELETE | `/api/risks/[id]` | Delete risk |

**Risk payload:**
```json
{
  "title": "Monsoon delay risk",
  "description": "Heavy rainfall may delay slab work by 2-3 weeks",
  "category": "Weather",
  "likelihood": "High",
  "impact": "High",
  "mitigationPlan": "Waterproof covering + scheduling buffer",
  "owner": "<userId>"
}
```

**Risk score:** `likelihood × impact` — typically displayed as risk matrix  
**Risk status:** `Open`, `Mitigated`, `Accepted`, `Closed`

---

### Snags (Defects)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/projects/[id]/snags` | List project snags |
| POST | `/api/projects/[id]/snags` | Create snag |
| GET | `/api/snags/[id]` | Get single snag |
| PATCH | `/api/snags/[id]` | Update snag |
| DELETE | `/api/snags/[id]` | Delete snag |
| GET | `/api/projects/assigned-snagging` | Snags assigned to current user (cross-project) |

**Snag payload:**
```json
{
  "title": "Uneven plastering — Room 201",
  "location": "Room 201, 2nd Floor",
  "description": "Plaster uneven near window frame, needs rework",
  "priority": "Medium",
  "assignedTo": "<userId>",
  "photos": ["https://res.cloudinary.com/..."],
  "dueDate": "2026-05-25"
}
```

**Snag status:** `Open`, `In Progress`, `Resolved`, `Closed`

---

### Site Survey

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/projects/[id]/survey` | Get survey data for project |
| POST | `/api/projects/[id]/survey` | Submit/update survey data |

**Survey payload (varies by project type — fields captured during site visit):**
```json
{
  "siteCondition": "Good",
  "soilType": "Hard Murrum",
  "accessRoad": true,
  "waterSupply": true,
  "electricityAvailable": true,
  "notes": "Site is clear, boundary wall needed on east side",
  "photos": ["https://res.cloudinary.com/..."],
  "surveyDate": "2026-05-12"
}
```

---

### Escalation Matrix

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/projects/[id]/escalation-matrix` | Get escalation rules |
| POST | `/api/projects/[id]/escalation-matrix` | Create/update escalation rules |

**Escalation matrix defines:** who gets notified/escalated to when an issue/risk crosses a threshold (e.g., unresolved for X days)

---

## Test Scenarios

### 07-A — Issues tab — Create an issue
1. Open project → Issues tab
2. Click "Add Issue"
3. Fill: Title, Description, Priority = High, Category = Structural, assign to a user, attach a photo
4. **Assert:** Photo uploads to Cloudinary successfully
5. **Assert:** `POST /api/projects/[id]/issues` returns `201`
6. **Assert:** Issue card appears with priority badge and assignee avatar

### 07-B — Issue detail view
1. Click on the issue card
2. **Assert:** Detail modal opens with all fields displayed
3. **Assert:** `GET /api/issues/[id]` returns full issue with comments/attachments

### 07-C — Update issue status
1. In the issue card or detail view, change status → "In Progress"
2. **Assert:** `PATCH /api/issues/[id]` returns `200`
3. **Assert:** Status badge updates on list

### 07-D — Resolve and close issue
1. Change status → "Resolved", then → "Closed"
2. **Assert:** Issue moves to correct status group / filter

### 07-E — Issues filter
1. Filter by priority "High"
2. **Assert:** Only high priority issues shown
3. Filter by status "Open"
4. **Assert:** Only open issues shown

### 07-F — Risks tab — Create a risk
1. Open project → Risks tab
2. Click "Add Risk"
3. Fill: Title, Likelihood = High, Impact = High, Mitigation Plan, assign Owner
4. **Assert:** `POST /api/projects/[id]/risks` returns `201`
5. **Assert:** Risk shows with correct likelihood × impact score/color

### 07-G — Risk detail and update
1. Click on risk → detail view
2. Update mitigation plan
3. Change status to "Mitigated"
4. **Assert:** `PATCH /api/risks/[id]` returns `200`

### 07-H — Snag creation (with photo)
1. Any tab where snags are accessible (or project detail)
2. Create a snag with title, location, priority, photo, assign to user
3. **Assert:** `POST /api/projects/[id]/snags` returns `201`
4. **Assert:** Snag listed with photo thumbnail

### 07-I — Assigned snags cross-project view
1. Login as the user who was assigned a snag
2. Call or navigate to the assigned-snagging view
3. **Assert:** `GET /api/projects/assigned-snagging` returns only snags assigned to the current user across all projects

### 07-J — Site Survey tab
1. Open project → Survey tab
2. **Assert:** If `needSiteSurvey = true` on the project, survey form/view is enabled
3. Fill survey form — soil type, access road, water supply, photos
4. **Assert:** `POST /api/projects/[id]/survey` returns `201`
5. **Assert:** Survey data displayed in the SurveyDetailModal

### 07-K — Escalation Matrix
1. Open Escalation Matrix (from project or settings)
2. Set a rule: "If issue is unresolved for 3 days, escalate to Project Manager"
3. **Assert:** `POST /api/projects/[id]/escalation-matrix` returns `201`
4. **Assert:** Rules listed correctly

---

## Notes
- Issues, Risks, and Snags all support photo attachments via Cloudinary
- Snags are quality/defect items — typically used during handover/inspection phase
- Site Survey is only meaningful if `project.needSiteSurvey = true` (set at project creation)
- The `assigned-snagging` endpoint is a cross-project query — scoped to current user's org AND their userId
- Risk score = likelihood label × impact label (mapped to numeric values 1-5 on backend)
