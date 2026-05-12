# Phase 05 — BOQ & Budget

**Status:** ⬜ Not Started  
**Depends on:** Phase 03 (need a project)

---

## Scope

| Area | Detail |
|------|--------|
| Frontend pages | `http://localhost:3000/projects/[id]` — tabs: BOQ, Budget |
| API routes | `/api/projects/[id]/boq`, `/api/projects/[id]/boq/[itemId]`, `/api/projects/[id]/boq/[itemId]/status`, `/api/projects/[id]/boq/bulk-status`, `/api/projects/[id]/boq/import`, `/api/projects/[id]/boq/history/[historyId]`, `/api/projects/[id]/boq-approvers`, `/api/projects/[id]/budget-approvers`, `/api/projects/[id]/budget-request`, `/api/projects/[id]/budget-action`, `/api/projects/[id]/transactions` |
| Models | `BOQ`, `Transaction` |
| Components | `src/components/project/BOQTab.tsx`, `BOQModal.tsx`, `BOQImportModal.tsx`, `BOQHistoryModal.tsx`, `BOQApproversModal.tsx`, `BudgetTab.tsx` |

---

## API Endpoints

### BOQ

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/projects/[id]/boq` | List all BOQ items |
| POST | `/api/projects/[id]/boq` | Create BOQ item |
| GET | `/api/projects/[id]/boq/[itemId]` | Get single BOQ item |
| PATCH | `/api/projects/[id]/boq/[itemId]` | Update BOQ item |
| DELETE | `/api/projects/[id]/boq/[itemId]` | Delete BOQ item |
| PATCH | `/api/projects/[id]/boq/[itemId]/status` | Update item status |
| PATCH | `/api/projects/[id]/boq/bulk-status` | Bulk status update |
| POST | `/api/projects/[id]/boq/import` | Import BOQ from CSV/JSON |
| GET | `/api/projects/[id]/boq/history/[historyId]` | BOQ change history |
| GET | `/api/projects/[id]/boq-approvers` | List BOQ approvers |
| POST | `/api/projects/[id]/boq-approvers` | Set BOQ approvers |

**BOQ item payload:**
```json
{
  "category": "Civil",
  "description": "Excavation for foundation",
  "unit": "cum",
  "quantity": 150,
  "rate": 450,
  "milestoneId": "<optional>"
}
```
`amount` = `quantity × rate` (computed on backend)

**BOQ status values:** `Pending`, `In Progress`, `Completed`, `Approved`, `Rejected`

---

### Budget & Transactions

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/projects/[id]/budget-approvers` | List budget approvers |
| POST | `/api/projects/[id]/budget-approvers` | Set budget approvers |
| POST | `/api/projects/[id]/budget-request` | Request budget revision |
| POST | `/api/projects/[id]/budget-action` | Approve/Reject budget request |
| GET | `/api/projects/[id]/transactions` | List project transactions |
| POST | `/api/projects/[id]/transactions` | Add a transaction (payment in/out) |

**Transaction payload:**
```json
{
  "type": "Expense",
  "category": "Labour",
  "amount": 85000,
  "description": "Labour payment — Week 1",
  "date": "2026-05-12",
  "paymentMethod": "Bank Transfer",
  "referenceNumber": "TXN-001"
}
```

**Transaction types:** `Income`, `Expense`

---

## Test Scenarios

### 05-A — BOQ tab loads
1. Open project → BOQ tab
2. **Assert:** Empty state shown (no items yet)
3. **Assert:** Summary bar shows ₹0 total, 0 items

### 05-B — Create a BOQ item
1. Click "Add Item"
2. Fill: Category = "Civil", Description, Unit = "cum", Quantity = 150, Rate = 450
3. Save
4. **Assert:** `POST /api/projects/[id]/boq` returns `201`
5. **Assert:** Item appears with Amount = ₹67,500 (150 × 450)
6. **Assert:** Summary updates total

### 05-C — Edit a BOQ item
1. Click edit on the item
2. Change quantity to 200
3. **Assert:** Amount recalculates to ₹90,000

### 05-D — BOQ item status update
1. Select an item → change status to "In Progress"
2. **Assert:** `PATCH /api/projects/[id]/boq/[itemId]/status` returns `200`
3. **Assert:** Status badge updates

### 05-E — Bulk status update
1. Select multiple BOQ items (checkboxes)
2. Set all to "Completed"
3. **Assert:** `PATCH /api/projects/[id]/boq/bulk-status` called with array of IDs
4. **Assert:** All selected items update

### 05-F — BOQ import
1. Click "Import BOQ"
2. Upload a CSV with BOQ items
3. **Assert:** Items parsed and previewed
4. Confirm import
5. **Assert:** `POST /api/projects/[id]/boq/import` returns `201`
6. **Assert:** Imported items appear in list

### 05-G — BOQ Approvers
1. Click "Set Approvers" on BOQ tab
2. Select users as approvers
3. **Assert:** `POST /api/projects/[id]/boq-approvers` succeeds
4. **Assert:** Approvers listed in the approver section

### 05-H — Budget tab — Initial budget
1. Open project → Budget tab
2. **Assert:** Initial estimated budget shows from project creation (`budgetHistory[0]`)
3. **Assert:** Current approved budget displayed

### 05-I — Budget revision request
1. Click "Request Budget Revision"
2. New amount = ₹60,00,000, Reason = "Material cost increase"
3. Submit
4. **Assert:** `POST /api/projects/[id]/budget-request` returns `201`
5. **Assert:** Revision shows as "Pending Approval"

### 05-J — Approve budget revision
1. As an approver, open the budget request
2. Click Approve
3. **Assert:** `POST /api/projects/[id]/budget-action` with `{ action: "Approve" }`
4. **Assert:** Budget history shows new entry with "Approved" status

### 05-K — Add a transaction
1. Budget tab → Transactions section
2. Click "Add Transaction"
3. Fill: Type = Expense, Category = Labour, Amount = 85000, Date, Description
4. **Assert:** `POST /api/projects/[id]/transactions` returns `201`
5. **Assert:** Transaction listed with correct type color (Expense = red, Income = green)
6. **Assert:** Running balance / total expense updates

### 05-L — Finance page (global view)
1. Open `http://localhost:3000/finance`
2. **Assert:** Transactions across all projects visible
3. **Assert:** Summary totals (total income, total expense, net balance)

---

## Notes
- BOQ `amount` = `quantity × rate` — ensure backend computes this, not frontend
- Budget revisions go through an approval workflow. The `budgetHistory` array on Project tracks all changes
- Transactions are scoped to both project and organization
- `api/transactions` (global) vs `api/projects/[id]/transactions` (project-scoped) — both should return consistent data
