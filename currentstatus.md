# Sky-Lite Web — API Integration Status

> **API Base (prod):** `https://v2-lite-backend-saas-dtw3.vercel.app/api`  
> **API Base (local):** `http://localhost:3000/api`  
> **Socket URL:** `https://socket-7ezc.onrender.com`  
> **Cloudinary cloud:** `dfyu429bz`  
> **Web Stack:** Next.js 16.2.4 · TypeScript · Tailwind CSS v4 · React 19  
> **Reference App:** `C:\2026\v2\sky-lite` (React Native / Expo — same backend, same design)  
> **Last updated:** 2026-05-04  
> **Legend:** ✅ Done · 🔄 In Progress · ⬜ Pending

---

## Design System (from reference app — replicate on web)

| Token | Value |
|-------|-------|
| Primary | `#3B82F6` |
| Dark bg | `#0F172A` |
| Light bg | `#F8FAFF` / `#F0F9FF` |
| Glass border | `#E0F2FE` / `#E2E8F0` |
| Success | `#10B981` |
| Danger | `#EF4444` |
| Warning | `#D97706` |
| Font | Inter (400 / 600 / 700 / 900) |
| Card style | Glass morphism — backdrop-blur, 1px border, rounded-2xl |
| Background | Two gradient orbs: blue top-right, purple bottom-left |

---

## Phase 0 — Foundation & Infrastructure
> Do this entirely before any feature work. Order matters inside this phase.

| # | Task | Status | Notes |
|---|------|--------|-------|
| 0.1 | Create `.env.local` — `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_SOCKET_URL`, `NEXT_PUBLIC_CLOUDINARY_*` | ✅ | `.env.local` (localhost active) + `.env.production` (deployed) both created |
| 0.2 | `src/lib/api.ts` — typed fetch wrapper (attaches Bearer token, handles JSON) | ⬜ | Model after `projectService.js` in reference app |
| 0.3 | HTTP interceptor — auto-refresh access token on 401 via `POST /api/auth/refresh` | ⬜ | Reference app skipped this; add it on web |
| 0.4 | `src/types/index.ts` — TypeScript interfaces for all 21 API models | ⬜ | User, Project, BOQ, Material, Snag, Issue, Risk, Role, etc. |
| 0.5 | `src/context/AuthContext.tsx` — user, token state + login/logout/register actions | ⬜ | Reference: `app/context/AuthContext.js` |
| 0.6 | `src/context/ToastContext.tsx` — global toast (success / error / delete variants) | ⬜ | Reference: `app/context/ToastContext.js` + `AnimatedToast.jsx` |
| 0.7 | `src/context/SocketContext.tsx` — socket.io-client singleton, joinProject/leaveProject | ⬜ | Reference: `app/context/SocketContext.js` |
| 0.8 | `src/middleware.ts` — Next.js middleware for route protection (redirect → /login) | ⬜ | Equivalent to routing guard in `AuthContext.js` |
| 0.9 | Root providers wrapper (`AuthProvider → SocketProvider → ToastProvider`) | ⬜ | Reference: `app/_layout.jsx` provider nesting |
| 0.10 | Inter font loaded via `next/font/google` in root layout | ⬜ | |
| 0.11 | Global gradient background orbs (CSS, fixed position) | ⬜ | Blue top-right, purple bottom-left — match reference |
| 0.12 | Glass card utility class (Tailwind: `backdrop-blur`, border, rounded-2xl) | ⬜ | Reference: `AdaptiveGlass.jsx` / `GlassView.jsx` |
| 0.13 | Sidebar + topnav shell layout with mobile drawer | ⬜ | Web equivalent of reference bottom-tab nav |
| 0.14 | `ConfirmModal` component (success / error / destructive variants) | ⬜ | Reference: `components/ConfirmModal.jsx` |
| 0.15 | `Toast` component (auto-dismiss, icon, type variants) | ⬜ | Reference: `components/AnimatedToast.jsx` |

---

## Phase 1 — Authentication
> **API routes:** `POST /api/auth/login`, `/register`, `/refresh`, `/logout`

| # | Task | Status | Notes |
|---|------|--------|-------|
| 1.1 | `/login` page — email + password form with show/hide password | ⬜ | Reference: `app/auth/login.jsx` |
| 1.2 | Store `token` + `refreshToken` in `localStorage` (or httpOnly cookie via API route) | ⬜ | Reference uses expo-secure-store; use localStorage on web |
| 1.3 | `/register` page — name, email, password, confirm password with validation | ⬜ | Reference: `app/auth/register.jsx` |
| 1.4 | Logout — clear tokens, call `POST /auth/logout` for audit trail, redirect `/login` | ⬜ | |
| 1.5 | Silent refresh on app load — check token expiry, call `/auth/refresh` if needed | ⬜ | Reference skipped this; implement on web |
| 1.6 | Onboarding / welcome page (`/`) for first-time visitors | ⬜ | Reference: `app/onboarding.jsx` (3-step carousel) |

---

## Phase 2 — Projects (Core)
> **API routes:** `GET/POST /api/projects`, `GET/PATCH /api/projects/:id`  
> Reference: `app/(tabs)/project/index.jsx`, `app/project/[id]/index.jsx`

| # | Task | Status | Notes |
|---|------|--------|-------|
| 2.1 | `/projects` — project grid/list with search and status filter | ⬜ | Reference: `(tabs)/project/index.jsx` |
| 2.2 | Create project modal — name, description, budget, dates, priority, template picker | ⬜ | Reference: `app/create-project.jsx` |
| 2.3 | `/projects/[id]` — project workspace with horizontal tab pills (14 tabs) | ⬜ | Reference: `app/project/[id]/index.jsx` |
| 2.4 | Project Details tab — info, status badge, dates, members list | ⬜ | Reference: `app/project/[id]/details.jsx` |
| 2.5 | Project status change action (9 statuses, guard transitions) | ⬜ | |
| 2.6 | Edit project inline form | ⬜ | PATCH `/api/projects/:id` |
| 2.7 | "Assigned Snagging" notification / shortcut for assigned users | ⬜ | Reference: snagging notification on dashboard |

---

## Phase 3 — BOQ & Budget
> **API routes:** `/api/projects/:id/boq/*`, `/api/projects/:id/budget-*`  
> Reference: `app/project/[id]/boq.jsx`, `_components/BOQItem.jsx`, `_components/BOQModals.jsx`

| # | Task | Status | Notes |
|---|------|--------|-------|
| 3.1 | BOQ tab — table grouped by `groupName`, unit cost / total columns | ⬜ | Reference: `boq.jsx` + `BOQItem.jsx` |
| 3.2 | Add / edit BOQ item modal | ⬜ | Reference: `BOQModals.jsx` |
| 3.3 | BOQ status chip — Draft / Pending / Approved / Rejected | ⬜ | PATCH `…/boq/:itemId/status` |
| 3.4 | Bulk status update action | ⬜ | POST `…/boq/bulk-status` |
| 3.5 | Excel import for BOQ | ⬜ | POST `…/boq/import` — file input + upload |
| 3.6 | BOQ history timeline modal | ⬜ | GET `…/boq/history` |
| 3.7 | BOQ approvers assignment | ⬜ | GET/POST `…/boq-approvers` |
| 3.8 | Budget request form | ⬜ | POST `…/budget-request` |
| 3.9 | Budget approve / reject (approver role) | ⬜ | POST `…/budget-action` |
| 3.10 | Budget approvers management | ⬜ | GET/POST `…/budget-approvers` |
| 3.11 | Budget history log display | ⬜ | From project detail payload |

---

## Phase 4 — Material Management
> **API routes:** `/api/projects/:id/materials`, `/api/material-requests/*`, `/api/material-purchase/*`, `/api/material-receipts/*`, `/api/material-usage/*`  
> Reference: `app/project/[id]/material.jsx`

| # | Task | Status | Notes |
|---|------|--------|-------|
| 4.1 | Materials inventory table per project | ⬜ | GET `…/materials` |
| 4.2 | Add material + stock in/out form | ⬜ | POST + PATCH `/api/materials/:id` |
| 4.3 | Bulk material action | ⬜ | POST `…/materials/bulk-action` |
| 4.4 | Material request form — items list, common note | ⬜ | POST `…/material-requests` |
| 4.5 | Material requests list with status filter | ⬜ | GET `…/material-requests` |
| 4.6 | Material request detail + approve/reject | ⬜ | PATCH `/api/material-requests/:id` |
| 4.7 | Purchase order form — vendor, PO#, items, advance | ⬜ | POST `…/material-purchase` |
| 4.8 | Purchase orders list with payment status | ⬜ | GET `…/material-purchase` |
| 4.9 | Purchase order detail + status update | ⬜ | PATCH `/api/material-purchase/:id` |
| 4.10 | Material receipt form — challan/invoice, verify items | ⬜ | POST `…/material-receipts` |
| 4.11 | Receipts list — Pending / Verified / Rejected | ⬜ | GET `…/material-receipts` |
| 4.12 | Material usage log — items, location/task | ⬜ | POST `…/material-usage` |
| 4.13 | Usage list with verification status | ⬜ | GET `…/material-usage` |

---

## Phase 5 — Document & Plan Management
> **API routes:** `/api/projects/:id/documents`, `/api/projects/:id/folders/*`  
> Reference: `app/project/[id]/documents.jsx`, `plans.jsx`, `app/annotate-plan.jsx`, `app/document-viewer.jsx`

| # | Task | Status | Notes |
|---|------|--------|-------|
| 5.1 | Plan folders list + create folder | ⬜ | GET/POST `…/folders` |
| 5.2 | Folder detail — upload documents, file list | ⬜ | Reference: `plans.jsx` |
| 5.3 | PDF / document viewer (browser-native or pdf.js) | ⬜ | Reference: `document-viewer.jsx` uses `react-native-pdf` |
| 5.4 | Plan annotation tool (canvas overlay on image) | ⬜ | Reference: `annotate-plan.jsx` |
| 5.5 | Document approval workflow — per-approver status chips | ⬜ | POST `…/documents/:docId/action` |
| 5.6 | Plan approvers assignment | ⬜ | GET/POST `…/plan-approvers` |
| 5.7 | Documents list with approval status badges | ⬜ | GET `…/documents` |

---

## Phase 6 — Issues, Snags & Risks
> **API routes:** `/api/projects/:id/issues`, `…/snags`, `…/risks`  
> Reference: `app/project/[id]/issues.jsx`, `snagging.jsx`, `risk.jsx`

| # | Task | Status | Notes |
|---|------|--------|-------|
| 6.1 | Issues list — filter by status, priority, category | ⬜ | Reference: `issues.jsx` |
| 6.2 | Create / edit issue form | ⬜ | POST `…/issues` |
| 6.3 | Issue detail — status workflow, escalation level | ⬜ | GET `/api/issues/:id` |
| 6.4 | Issue status update | ⬜ | PATCH `/api/issues/:id` |
| 6.5 | Snags list — kanban or table view | ⬜ | Reference: `snagging.jsx` |
| 6.6 | Create / edit snag — title, priority, assignee, images (Cloudinary upload) | ⬜ | POST `…/snags` |
| 6.7 | Snag detail — resolution notes, image gallery, history | ⬜ | GET `/api/snags/:id` |
| 6.8 | Snag status update | ⬜ | PATCH `/api/snags/:id` |
| 6.9 | Risk register list — filter by status, category | ⬜ | Reference: `risk.jsx` |
| 6.10 | Create / edit risk — category, impact, probability, owner | ⬜ | POST `…/risks` |
| 6.11 | Risk detail — mitigation progress, history | ⬜ | GET `/api/risks/:id` |
| 6.12 | Escalation matrix configuration | ⬜ | GET/POST `…/escalation-matrix` |

---

## Phase 7 — Progress & Milestones
> **API routes:** `/api/projects/:id/milestones`, `…/work-progress`, `…/survey`  
> Reference: `app/project/[id]/milestones.jsx`, `progress.jsx`, `timeline.jsx`, `site-survey.jsx`  
> Service: `app/services/projectService.js` (`milestoneService`, `workProgressService`)

| # | Task | Status | Notes |
|---|------|--------|-------|
| 7.1 | Milestones list — cards or timeline view | ⬜ | Reference: `milestones.jsx` |
| 7.2 | Create / edit milestone — name, due date, tasks | ⬜ | `milestoneService.createMilestone()` |
| 7.3 | Milestone detail — task checklist, status update | ⬜ | Reference: `milestone/[milestoneId].jsx` |
| 7.4 | Work progress log form — description, progress %, Cloudinary photo upload | ⬜ | `workProgressService.createLog()` |
| 7.5 | Work progress list + photo gallery | ⬜ | Reference: `progress.jsx` |
| 7.6 | Progress summary widget (overall % complete) | ⬜ | `workProgressService.getSummary()` |
| 7.7 | Timeline / Gantt view | ⬜ | Reference: `timeline.jsx` |
| 7.8 | Site survey form — accessibility, power, water, terrain, attachments | ⬜ | Reference: `site-survey.jsx` |
| 7.9 | Site survey detail view (read-only + budget recommendation) | ⬜ | GET `…/survey` |

---

## Phase 8 — Financial Tracking
> **API routes:** `/api/projects/:id/transactions`, `/api/transactions`  
> Reference: `app/project/[id]/transactions.jsx`, `app/(tabs)/payment/index.jsx`

| # | Task | Status | Notes |
|---|------|--------|-------|
| 8.1 | Project transactions list — filter by type | ⬜ | GET `…/transactions` |
| 8.2 | Add transaction form — type, amount, date, method, party | ⬜ | POST `…/transactions` |
| 8.3 | Transaction detail / edit | ⬜ | GET/PUT `/api/transactions/:id` |
| 8.4 | Global transactions view (across all projects) | ⬜ | Reference: `(tabs)/payment/index.jsx` |
| 8.5 | Financial summary widget — total in/out, balance | ⬜ | Client-side aggregation |

---

## Phase 9 — Users & Role Management
> **API routes:** `/api/users`, `/api/roles`  
> Reference: `app/user-management/index.jsx` (roles), `members.jsx`, `permissions.jsx`

| # | Task | Status | Notes |
|---|------|--------|-------|
| 9.1 | Users list — filter by project, role, status | ⬜ | Reference: `members.jsx` |
| 9.2 | Onboard user form — name, email, role (triggers welcome email) | ⬜ | POST `/api/users` |
| 9.3 | User detail / edit | ⬜ | GET/PUT `/api/users/:id` |
| 9.4 | Deactivate / remove user | ⬜ | DELETE `/api/users/:id` |
| 9.5 | Roles list with user counts | ⬜ | Reference: `user-management/index.jsx` |
| 9.6 | Create / edit role | ⬜ | POST/PUT `/api/roles/:id` |
| 9.7 | Permission picker — checkbox grid of `resource:action` strings | ⬜ | Reference: `permissions.jsx` + `PermissionToggle.jsx` + `ModulePermissionCard.jsx` |
| 9.8 | Delete role (warn if users assigned) | ⬜ | DELETE `/api/roles/:id` |

---

## Phase 10 — Templates
> **API routes:** `/api/templates`, `/api/template-categories`  
> Reference: `app/(tabs)/template/index.jsx`, `app/create-template.jsx`, `app/view-template.jsx`

| # | Task | Status | Notes |
|---|------|--------|-------|
| 10.1 | Template categories list + CRUD | ⬜ | GET/POST `/api/template-categories` |
| 10.2 | Templates list — filter by category, status | ⬜ | Reference: `(tabs)/template/index.jsx` |
| 10.3 | Create / edit template — name, category, budget range, BOQ items, images | ⬜ | Reference: `create-template.jsx` |
| 10.4 | Template detail / preview | ⬜ | Reference: `view-template.jsx` |
| 10.5 | Apply template when creating a project (pre-fills BOQ) | ⬜ | UI flow only |

---

## Phase 11 — Real-time (Socket.io)
> **Socket server:** `https://socket-7ezc.onrender.com`  
> Reference: `app/context/SocketContext.js`

| # | Task | Status | Notes |
|---|------|--------|-------|
| 11.1 | Install `socket.io-client` | ⬜ | |
| 11.2 | `src/lib/socket.ts` — singleton instance, connect with `auth: { token }` | ⬜ | Reference: `SocketContext.js` |
| 11.3 | `useProjectSocket(projectId)` hook — join room on mount, leave on unmount | ⬜ | `joinProject(id)` / `leaveProject(id)` |
| 11.4 | Live snag/issue status refresh without page reload | ⬜ | |
| 11.5 | Live material receipt / usage verification alerts | ⬜ | |
| 11.6 | Live work progress updates | ⬜ | |
| 11.7 | Toast on incoming socket events | ⬜ | Integrate with ToastContext |

---

## Phase 12 — SuperAdmin Portal
> **API routes:** `/api/superadmin/*` — separate cookie-based auth  
> Reference: not in mobile app (web-only portal)

| # | Task | Status | Notes |
|---|------|--------|-------|
| 12.1 | `/superadmin/login` page — separate from user login | ⬜ | POST `/api/superadmin/auth/login` |
| 12.2 | SuperAdmin layout (separate root layout segment) | ⬜ | |
| 12.3 | Admins list + create admin | ⬜ | GET/POST `/api/superadmin/admins` |
| 12.4 | Organization / tenant overview | ⬜ | |
| 12.5 | SuperAdmin logout | ⬜ | POST `/api/superadmin/auth/logout` |

---

## Phase 13 — Dashboards & Analytics
> Client-side aggregation from existing API endpoints.

| # | Task | Status | Notes |
|---|------|--------|-------|
| 13.1 | Project overview — status distribution, budget vs actual | ⬜ | |
| 13.2 | Material flow summary — requested / received / consumed | ⬜ | |
| 13.3 | Financial dashboard — income / expense chart | ⬜ | |
| 13.4 | Issue & snag heatmap — open vs resolved | ⬜ | |
| 13.5 | Milestone completion % across projects | ⬜ | |
| 13.6 | Risk matrix visualization — impact × probability grid | ⬜ | |

---

## Cross-Cutting Concerns

| # | Concern | Status | Notes |
|---|---------|--------|-------|
| C1 | CORS — API already allows all origins | ✅ | |
| C2 | Token auto-refresh on 401 | ⬜ | Phase 0.3 |
| C3 | RBAC — hide UI by `user.role.permissions` array | ⬜ | Reference: `isAdmin` checks throughout pages |
| C4 | Cloudinary file/image upload component | ⬜ | Cloud name: `dfyu429bz`; reference: `cloudinaryService.js` |
| C5 | Pagination on all list views | ⬜ | |
| C6 | Search + filter on all list views | ⬜ | Reference uses inline `.filter()` |
| C7 | Audit trail display (who changed what + when) | ⬜ | Embedded in most models |
| C8 | Mobile-responsive layout | ⬜ | |
| C9 | Dark mode (Tailwind already configured) | ⬜ | |
| C10 | Error states — 401 redirect, 403 banner, 500 retry | ⬜ | |

---

## Key Implementation References

| What to build | Look at in `C:\2026\v2\sky-lite\app\` |
|---------------|--------------------------------------|
| Auth context | `context/AuthContext.js` |
| Socket context | `context/SocketContext.js` |
| Toast context + component | `context/ToastContext.js` + `components/AnimatedToast.jsx` |
| Confirm modal | `components/ConfirmModal.jsx` |
| API fetch pattern | `services/projectService.js` |
| Cloudinary upload | `services/cloudinaryService.js` |
| Project list page | `(tabs)/project/index.jsx` |
| Project workspace tabs | `project/[id]/index.jsx` |
| BOQ table + modals | `project/[id]/boq.jsx` + `_components/BOQItem.jsx` + `BOQModals.jsx` |
| Permission matrix UI | `user-management/permissions.jsx` + `components/ModulePermissionCard.jsx` |
| Role management | `user-management/index.jsx` |
| Members list | `user-management/members.jsx` |
| Milestones + progress | `project/[id]/milestones.jsx` + `project/[id]/progress.jsx` |
| Material management | `project/[id]/material.jsx` |
| Transactions | `project/[id]/transactions.jsx` + `(tabs)/payment/index.jsx` |
| Risk register | `project/[id]/risk.jsx` |
| Issues | `project/[id]/issues.jsx` |
| Snagging/handover | `project/[id]/snagging.jsx` |
| Timeline/Gantt | `project/[id]/timeline.jsx` |
| Document viewer | `document-viewer.jsx` |
| Plan annotation | `annotate-plan.jsx` |
| Create project | `create-project.jsx` |
| Template builder | `create-template.jsx` |

---

## Recommended Build Order

```
Phase 0 → Phase 1 → Phase 2 → Phase 9 → Phase 3 → Phase 4
→ Phase 5 → Phase 6 → Phase 7 → Phase 8 → Phase 10
→ Phase 11 → Phase 12 → Phase 13
```

---

## Progress Summary

| Phase | Total | Done | In Progress | Pending |
|-------|-------|------|-------------|---------|
| 0 — Foundation | 15 | 1 | 0 | 14 |
| 1 — Auth | 6 | 0 | 0 | 6 |
| 2 — Projects | 7 | 0 | 0 | 7 |
| 3 — BOQ & Budget | 11 | 0 | 0 | 11 |
| 4 — Materials | 13 | 0 | 0 | 13 |
| 5 — Documents | 7 | 0 | 0 | 7 |
| 6 — Issues/Snags/Risks | 12 | 0 | 0 | 12 |
| 7 — Progress & Milestones | 9 | 0 | 0 | 9 |
| 8 — Financials | 5 | 0 | 0 | 5 |
| 9 — Users & Roles | 8 | 0 | 0 | 8 |
| 10 — Templates | 5 | 0 | 0 | 5 |
| 11 — Real-time | 7 | 0 | 0 | 7 |
| 12 — SuperAdmin | 5 | 0 | 0 | 5 |
| 13 — Dashboards | 6 | 0 | 0 | 6 |
| **Cross-cutting** | 10 | 1 | 0 | 9 |
| **TOTAL** | **126** | **2** | **0** | **124** |
