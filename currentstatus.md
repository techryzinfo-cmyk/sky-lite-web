# Sky-Lite Web — API Integration Status

> **API Base (prod):** `https://v2-lite-backend-saas-dtw3.vercel.app/api`  
> **API Base (local):** `http://localhost:3000/api`  
> **Socket URL:** `https://socket-7ezc.onrender.com`  
> **Cloudinary cloud:** `dfyu429bz`  
> **Web Stack:** Next.js 16.2.4 · TypeScript · Tailwind CSS v4 · React 19  
> **Reference App:** `C:\2026\v2\sky-lite` (React Native / Expo — same backend, same design)  
> **Last updated:** 2026-05-05  
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
| 0.2 | `src/lib/api.ts` — typed fetch wrapper (attaches Bearer token, handles JSON) | ✅ | Implemented with axios; request interceptor attaches Bearer token from localStorage |
| 0.3 | HTTP interceptor — auto-refresh access token on 401 via `POST /api/auth/refresh` | ✅ | Response interceptor in `api.ts` handles 401, calls `/auth/refresh`, retries original request, redirects to `/login` on failure |
| 0.4 | `src/types/index.ts` — TypeScript interfaces for all 21 API models | 🔄 | User, Role, Organization, Project, ProjectDocument, BudgetHistory, BOQItem defined — Material, Snag, Issue, Risk, Milestone, Transaction, Template interfaces still missing |
| 0.5 | `src/context/AuthContext.tsx` — user, token state + login/logout/register actions | ✅ | Implemented; stores token in both localStorage and cookie (for middleware) |
| 0.6 | `src/context/ToastContext.tsx` — global toast (success / error / delete variants) | ✅ | Implemented via `react-hot-toast`; success, error, info, loading, dismiss variants with glassmorphism styling |
| 0.7 | `src/context/SocketContext.tsx` — socket.io-client singleton, joinProject/leaveProject | ✅ | Implemented; connects with `auth: { token }`, exposes `joinProject`/`leaveProject` |
| 0.8 | `src/middleware.ts` — Next.js middleware for route protection (redirect → /login) | ✅ | Implemented; reads cookie `token`, redirects unauthenticated requests, redirects authenticated users away from login/register |
| 0.9 | Root providers wrapper (`AuthProvider → SocketProvider → ToastProvider`) | ✅ | In `app/layout.tsx`: `AuthProvider → ToastProvider → SocketProvider` |
| 0.10 | Inter font loaded via `next/font/google` in root layout | ✅ | Loaded with `variable: "--font-inter"` |
| 0.11 | Global gradient background orbs (CSS, fixed position) | ✅ | In `app/layout.tsx`: blue top-right, purple bottom-left, `blur-[120px]` |
| 0.12 | Glass card utility class (Tailwind: `backdrop-blur`, border, rounded-2xl) | ✅ | `src/components/ui/GlassCard.tsx` with optional `gradient` prop |
| 0.13 | Sidebar + topnav shell layout with mobile drawer | ✅ | `Shell.tsx` + `Sidebar.tsx` + `Topnav.tsx`; mobile hamburger drawer implemented |
| 0.14 | `ConfirmModal` component (success / error / destructive variants) | ✅ | `src/components/ui/ConfirmModal.tsx` |
| 0.15 | `Toast` component (auto-dismiss, icon, type variants) | ✅ | Handled by `react-hot-toast` inside `ToastContext` with custom glass styling |

---

## Phase 1 — Authentication
> **API routes:** `POST /api/auth/login`, `/register`, `/refresh`, `/logout`

| # | Task | Status | Notes |
|---|------|--------|-------|
| 1.1 | `/login` page — email + password form with show/hide password | ✅ | `app/login/page.tsx`; show/hide password toggle, loading state, registered=true success banner |
| 1.2 | Store `token` + `refreshToken` in `localStorage` (or httpOnly cookie via API route) | ✅ | Stored in localStorage + `js-cookie` (cookie used by middleware for SSR route guard) |
| 1.3 | `/register` page — name, email, password, confirm password with validation | ✅ | `app/register/page.tsx`; password match + min-length validation |
| 1.4 | Logout — clear tokens, call `POST /auth/logout` for audit trail, redirect `/login` | ⬜ | Client-side clear + redirect done; API call to `/auth/logout` not yet made |
| 1.5 | Silent refresh on app load — check token expiry, call `/auth/refresh` if needed | ✅ | Handled by axios 401 interceptor in `api.ts`; token checked from cookie/localStorage on mount in `AuthContext` |
| 1.6 | Onboarding / welcome page (`/`) for first-time visitors | ✅ | `app/onboarding/page.tsx`; 3-slide carousel with framer-motion animations |

---

## Phase 2 — Projects (Core)
> **API routes:** `GET/POST /api/projects`, `GET/PATCH /api/projects/:id`  
> Reference: `app/(tabs)/project/index.jsx`, `app/project/[id]/index.jsx`

| # | Task | Status | Notes |
|---|------|--------|-------|
| 2.1 | `/projects` — project grid/list with search and status filter | ✅ | `app/projects/page.tsx`; search by name/client, status dropdown filter, grid/list toggle UI |
| 2.2 | Create project modal — name, description, budget, dates, priority, template picker | ✅ | `src/components/ui/CreateProjectModal.tsx` |
| 2.3 | `/projects/[id]` — project workspace with horizontal tab pills (14 tabs) | ✅ | `app/projects/[id]/page.tsx`; 14 scrollable tab pills: Details, BOQ, Budget, Materials, Documents, Plans, Issues, Snags, Risks, Milestones, Progress, Timeline, Site Survey, Finance |
| 2.4 | Project Details tab — info, status badge, dates, members list | ✅ | Rendered inline in `[id]/page.tsx`; shows description, client, timeline, budget, priority, members panel |
| 2.5 | Project status change action (9 statuses, guard transitions) | ✅ | Inline `<select>` in project header calls `PATCH /projects/:id`; toasts on success/error |
| 2.6 | Edit project inline form | ⬜ | Details tab is read-only; no edit form wired yet |
| 2.7 | "Assigned Snagging" notification / shortcut for assigned users | ⬜ | Not implemented |

---

## Phase 3 — BOQ & Budget
> **API routes:** `/api/projects/:id/boq/*`, `/api/projects/:id/budget-*`  
> Reference: `app/project/[id]/boq.jsx`, `_components/BOQItem.jsx`, `_components/BOQModals.jsx`

| # | Task | Status | Notes |
|---|------|--------|-------|
| 3.1 | BOQ tab — table grouped by `groupName`, unit cost / total columns | ✅ | `src/components/project/BOQTab.tsx`; collapsible groups, search filter |
| 3.2 | Add / edit BOQ item modal | ✅ | `src/components/project/BOQModal.tsx` |
| 3.3 | BOQ status chip — Draft / Pending / Approved / Rejected | ✅ | Status badges with color-coded chips; status update via PATCH |
| 3.4 | Bulk status update action | ⬜ | Not implemented |
| 3.5 | Excel import for BOQ | ✅ | `src/components/project/BOQImportModal.tsx`; file input for Excel upload |
| 3.6 | BOQ history timeline modal | ⬜ | Not implemented |
| 3.7 | BOQ approvers assignment | ⬜ | Not implemented |
| 3.8 | Budget request form | ✅ | `src/components/project/BudgetTab.tsx`; budget request form implemented |
| 3.9 | Budget approve / reject (approver role) | ✅ | Approve/reject actions in `BudgetTab` |
| 3.10 | Budget approvers management | ⬜ | Not implemented |
| 3.11 | Budget history log display | ✅ | Budget history timeline displayed in `BudgetTab` |

---

## Phase 4 — Material Management
> **API routes:** `/api/projects/:id/materials`, `/api/material-requests/*`, `/api/material-purchase/*`, `/api/material-receipts/*`, `/api/material-usage/*`  
> Reference: `app/project/[id]/material.jsx`

| # | Task | Status | Notes |
|---|------|--------|-------|
| 4.1 | Materials inventory table per project | ✅ | `src/components/project/MaterialsTab.tsx` — Inventory sub-tab |
| 4.2 | Add material + stock in/out form | ✅ | `src/components/project/MaterialModal.tsx` |
| 4.3 | Bulk material action | ⬜ | Not implemented |
| 4.4 | Material request form — items list, common note | ✅ | `src/components/project/MaterialRequestModal.tsx` |
| 4.5 | Material requests list with status filter | ✅ | Requests sub-tab in `MaterialsTab` |
| 4.6 | Material request detail + approve/reject | ✅ | Approve/reject actions in requests list |
| 4.7 | Purchase order form — vendor, PO#, items, advance | ✅ | `src/components/project/MaterialPurchaseModal.tsx` |
| 4.8 | Purchase orders list with payment status | ✅ | Purchase Orders sub-tab in `MaterialsTab` |
| 4.9 | Purchase order detail + status update | ✅ | Status update in purchase orders list |
| 4.10 | Material receipt form — challan/invoice, verify items | ✅ | `src/components/project/MaterialReceiptModal.tsx` |
| 4.11 | Receipts list — Pending / Verified / Rejected | ✅ | Receipts (GRN) sub-tab in `MaterialsTab` |
| 4.12 | Material usage log — items, location/task | ✅ | `src/components/project/MaterialUsageModal.tsx` |
| 4.13 | Usage list with verification status | ✅ | Usage Log sub-tab in `MaterialsTab` |

---

## Phase 5 — Document & Plan Management
> **API routes:** `/api/projects/:id/documents`, `/api/projects/:id/folders/*`  
> Reference: `app/project/[id]/documents.jsx`, `plans.jsx`, `app/annotate-plan.jsx`, `app/document-viewer.jsx`

| # | Task | Status | Notes |
|---|------|--------|-------|
| 5.1 | Plan folders list + create folder | ✅ | `src/components/project/PlansTab.tsx` |
| 5.2 | Folder detail — upload documents, file list | ✅ | File upload and listing within `PlansTab` |
| 5.3 | PDF / document viewer (browser-native or pdf.js) | ✅ | `src/components/project/DocumentViewer.tsx` |
| 5.4 | Plan annotation tool (canvas overlay on image) | ⬜ | `PlanRoom.tsx` exists but canvas annotation not yet implemented |
| 5.5 | Document approval workflow — per-approver status chips | ✅ | Approval actions in `PlansTab` |
| 5.6 | Plan approvers assignment | ⬜ | Not implemented |
| 5.7 | Documents list with approval status badges | ✅ | Status badges in `PlansTab` |

---

## Phase 6 — Issues, Snags & Risks
> **API routes:** `/api/projects/:id/issues`, `…/snags`, `…/risks`  
> Reference: `app/project/[id]/issues.jsx`, `snagging.jsx`, `risk.jsx`

| # | Task | Status | Notes |
|---|------|--------|-------|
| 6.1 | Issues list — filter by status, priority, category | ✅ | `src/components/project/IssuesTab.tsx`; shared component handles both Issues and Snags tabs |
| 6.2 | Create / edit issue form | ✅ | `src/components/project/IssueModal.tsx` |
| 6.3 | Issue detail — status workflow, escalation level | ⬜ | No dedicated detail view; inline status update only |
| 6.4 | Issue status update | ✅ | Status update via PATCH in `IssuesTab` |
| 6.5 | Snags list — kanban or table view | ✅ | Handled by `IssuesTab` (same component, different data endpoint) |
| 6.6 | Create / edit snag — title, priority, assignee, images (Cloudinary upload) | ✅ | Handled by `IssueModal` for snags; Cloudinary upload pending (C4) |
| 6.7 | Snag detail — resolution notes, image gallery, history | ⬜ | Not implemented |
| 6.8 | Snag status update | ✅ | Via `IssuesTab` PATCH call |
| 6.9 | Risk register list — filter by status, category | ✅ | `src/components/project/RisksTab.tsx` |
| 6.10 | Create / edit risk — category, impact, probability, owner | ✅ | Create/edit form within `RisksTab` |
| 6.11 | Risk detail — mitigation progress, history | ⬜ | Not implemented |
| 6.12 | Escalation matrix configuration | ⬜ | Not implemented |

---

## Phase 7 — Progress & Milestones
> **API routes:** `/api/projects/:id/milestones`, `…/work-progress`, `…/survey`  
> Reference: `app/project/[id]/milestones.jsx`, `progress.jsx`, `timeline.jsx`, `site-survey.jsx`  
> Service: `app/services/projectService.js` (`milestoneService`, `workProgressService`)

| # | Task | Status | Notes |
|---|------|--------|-------|
| 7.1 | Milestones list — cards or timeline view | ✅ | `src/components/project/MilestonesTab.tsx` |
| 7.2 | Create / edit milestone — name, due date, tasks | ✅ | Create/edit form within `MilestonesTab` |
| 7.3 | Milestone detail — task checklist, status update | ⬜ | No dedicated task-checklist detail view |
| 7.4 | Work progress log form — description, progress %, Cloudinary photo upload | ✅ | `src/components/project/DPRTab.tsx` + `DPRModal.tsx` (Daily Progress Report) |
| 7.5 | Work progress list + photo gallery | ✅ | List displayed in `DPRTab` |
| 7.6 | Progress summary widget (overall % complete) | ⬜ | Not implemented |
| 7.7 | Timeline / Gantt view | ⬜ | Tab exists in workspace but renders "Coming Soon" placeholder |
| 7.8 | Site survey form — accessibility, power, water, terrain, attachments | ✅ | `src/components/project/SurveyTab.tsx` + `SurveyModal.tsx` |
| 7.9 | Site survey detail view (read-only + budget recommendation) | ✅ | Detail view in `SurveyTab` |

---

## Phase 8 — Financial Tracking
> **API routes:** `/api/projects/:id/transactions`, `/api/transactions`  
> Reference: `app/project/[id]/transactions.jsx`, `app/(tabs)/payment/index.jsx`

| # | Task | Status | Notes |
|---|------|--------|-------|
| 8.1 | Project transactions list — filter by type | ⬜ | Finance tab exists in workspace but renders "Coming Soon" — no component built |
| 8.2 | Add transaction form — type, amount, date, method, party | ⬜ | Not implemented |
| 8.3 | Transaction detail / edit | ⬜ | Not implemented |
| 8.4 | Global transactions view (across all projects) | ⬜ | Not implemented |
| 8.5 | Financial summary widget — total in/out, balance | ⬜ | Not implemented |

---

## Phase 9 — Users & Role Management
> **API routes:** `/api/users`, `/api/roles`  
> Reference: `app/user-management/index.jsx` (roles), `members.jsx`, `permissions.jsx`

| # | Task | Status | Notes |
|---|------|--------|-------|
| 9.1 | Users list — filter by project, role, status | ✅ | `src/components/users/UserList.tsx`; `/app/users/page.tsx` with Users / Roles tab toggle |
| 9.2 | Onboard user form — name, email, role (triggers welcome email) | ✅ | `src/components/users/UserModal.tsx` |
| 9.3 | User detail / edit | ✅ | Edit handled inside `UserModal` |
| 9.4 | Deactivate / remove user | ✅ | Delete action in `UserList` |
| 9.5 | Roles list with user counts | ✅ | `src/components/users/RoleList.tsx` |
| 9.6 | Create / edit role | ✅ | `src/components/users/RoleModal.tsx` |
| 9.7 | Permission picker — checkbox grid of `resource:action` strings | ⬜ | Not yet a full checkbox grid; permissions input is basic in `RoleModal` |
| 9.8 | Delete role (warn if users assigned) | ✅ | Delete action with confirmation in `RoleList` |

---

## Phase 10 — Templates
> **API routes:** `/api/templates`, `/api/template-categories`  
> Reference: `app/(tabs)/template/index.jsx`, `app/create-template.jsx`, `app/view-template.jsx`

| # | Task | Status | Notes |
|---|------|--------|-------|
| 10.1 | Template categories list + CRUD | ✅ | `src/components/templates/CategoryList.tsx`; `/app/templates/page.tsx` with Templates / Categories tab toggle |
| 10.2 | Templates list — filter by category, status | ✅ | `src/components/templates/TemplateList.tsx` |
| 10.3 | Create / edit template — name, category, budget range, BOQ items, images | ✅ | `src/components/templates/TemplateModal.tsx` |
| 10.4 | Template detail / preview | ⬜ | Not implemented |
| 10.5 | Apply template when creating a project (pre-fills BOQ) | ⬜ | Not wired into `CreateProjectModal` |

---

## Phase 11 — Real-time (Socket.io)
> **Socket server:** `https://socket-7ezc.onrender.com`  
> Reference: `app/context/SocketContext.js`

| # | Task | Status | Notes |
|---|------|--------|-------|
| 11.1 | Install `socket.io-client` | ✅ | Used in `SocketContext.tsx` |
| 11.2 | `src/lib/socket.ts` — singleton instance, connect with `auth: { token }` | ✅ | Socket singleton in `SocketContext.tsx` with `auth: { token }` |
| 11.3 | `useProjectSocket(projectId)` hook — join room on mount, leave on unmount | ✅ | `src/hooks/useProjectSocket.ts`; joins on mount, leaves on unmount, handles 9 event types |
| 11.4 | Live snag/issue status refresh without page reload | ✅ | `issue:created`, `issue:updated`, `snag:created`, `snag:updated` events handled |
| 11.5 | Live material receipt / usage verification alerts | ✅ | `material:updated` event handled |
| 11.6 | Live work progress updates | ✅ | `boq:updated`, `budget:updated`, `milestones:updated` events handled |
| 11.7 | Toast on incoming socket events | ✅ | Context-aware toasts: "created" → success, "updated" → info |

---

## Phase 12 — SuperAdmin Portal
> **API routes:** `/api/superadmin/*` — separate cookie-based auth  
> Reference: not in mobile app (web-only portal)

| # | Task | Status | Notes |
|---|------|--------|-------|
| 12.1 | `/superadmin/login` page — separate from user login | ✅ | `app/superadmin/login/page.tsx`; red-themed, calls `/superadmin/auth/login` |
| 12.2 | SuperAdmin layout (separate root layout segment) | ✅ | Standalone layout inside `superadmin/dashboard/page.tsx` with its own header/nav |
| 12.3 | Admins list + create admin | ✅ | Admins list fetched from `/superadmin/admins`; "Create Admin" button present (modal not yet wired) |
| 12.4 | Organization / tenant overview | ⬜ | Stats cards show hardcoded placeholder values; no API call for org/tenant data |
| 12.5 | SuperAdmin logout | ✅ | Clears `superadmin_token` from localStorage, redirects to `/superadmin/login` |

---

## Phase 13 — Dashboards & Analytics
> Client-side aggregation from existing API endpoints.

| # | Task | Status | Notes |
|---|------|--------|-------|
| 13.1 | Project overview — status distribution, budget vs actual | ✅ | `src/components/dashboard/OverviewDashboard.tsx` rendered on `/dashboard` |
| 13.2 | Material flow summary — requested / received / consumed | ⬜ | Not implemented |
| 13.3 | Financial dashboard — income / expense chart | ⬜ | Not implemented |
| 13.4 | Issue & snag heatmap — open vs resolved | ⬜ | Not implemented |
| 13.5 | Milestone completion % across projects | ⬜ | Not implemented |
| 13.6 | Risk matrix visualization — impact × probability grid | ⬜ | Not implemented |

---

## Cross-Cutting Concerns

| # | Concern | Status | Notes |
|---|---------|--------|-------|
| C1 | CORS — API already allows all origins | ✅ | |
| C2 | Token auto-refresh on 401 | ✅ | Axios response interceptor in `src/lib/api.ts` |
| C3 | RBAC — hide UI by `user.role.permissions` array | ⬜ | Not implemented; no permission checks in UI yet |
| C4 | Cloudinary file/image upload component | ⬜ | Cloud name `dfyu429bz` in env; no upload component built yet |
| C5 | Pagination on all list views | ⬜ | All lists load full data; no pagination implemented |
| C6 | Search + filter on all list views | ✅ | Implemented on Projects, BOQ, and main lists |
| C7 | Audit trail display (who changed what + when) | ⬜ | Not implemented |
| C8 | Mobile-responsive layout | ✅ | Shell with collapsible sidebar drawer; responsive grid layouts throughout |
| C9 | Dark mode (Tailwind already configured) | ⬜ | Dark mode is the only mode; no light/toggle |
| C10 | Error states — 401 redirect, 403 banner, 500 retry | ⬜ | 401 redirect done via middleware; 403/500 handling not implemented |

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

## Recommended Build Order (Remaining Work)

```
1. Finish types/index.ts (remaining 14 models)         [0.4]
2. Auth logout API call                                 [1.4]
3. Phase 8 — Financial Tracking (all 5 tasks)          [PRIORITY]
4. Permission picker checkbox grid                      [9.7]
5. Edit project form                                    [2.6]
6. Cloudinary upload component                          [C4]
7. BOQ history + approvers                              [3.6, 3.7]
8. Budget approvers                                     [3.10]
9. Issue/Snag/Risk detail views                         [6.3, 6.7, 6.11]
10. Escalation matrix                                   [6.12]
11. Milestone task checklist + progress summary         [7.3, 7.6]
12. Timeline / Gantt view                               [7.7]
13. Template detail + apply-to-project flow             [10.4, 10.5]
14. SuperAdmin org/tenant overview                      [12.4]
15. Dashboard analytics widgets                         [13.2–13.6]
16. RBAC permission guards in UI                        [C3]
17. Pagination across all lists                         [C5]
18. Audit trail display                                 [C7]
19. 403 / 500 error states                              [C10]
20. Plan annotation canvas tool                         [5.4]
21. Plan approvers                                      [5.6]
22. Bulk actions (BOQ, Materials)                       [3.4, 4.3]
23. Snagging notification for assigned users            [2.7]
```

---

## Progress Summary

| Phase | Total | Done | In Progress | Pending |
|-------|-------|------|-------------|---------|
| 0 — Foundation | 15 | 14 | 1 | 0 |
| 1 — Auth | 6 | 5 | 0 | 1 |
| 2 — Projects | 7 | 5 | 0 | 2 |
| 3 — BOQ & Budget | 11 | 7 | 0 | 4 |
| 4 — Materials | 13 | 12 | 0 | 1 |
| 5 — Documents | 7 | 5 | 0 | 2 |
| 6 — Issues/Snags/Risks | 12 | 8 | 0 | 4 |
| 7 — Progress & Milestones | 9 | 6 | 0 | 3 |
| 8 — Financials | 5 | 0 | 0 | 5 |
| 9 — Users & Roles | 8 | 7 | 0 | 1 |
| 10 — Templates | 5 | 3 | 0 | 2 |
| 11 — Real-time | 7 | 7 | 0 | 0 |
| 12 — SuperAdmin | 5 | 4 | 0 | 1 |
| 13 — Dashboards | 6 | 1 | 0 | 5 |
| **Cross-cutting** | 10 | 4 | 0 | 6 |
| **TOTAL** | **126** | **88** | **1** | **37** |
