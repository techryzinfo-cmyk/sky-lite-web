# Phase 06 — Materials & Supply Chain

**Status:** ⬜ Not Started  
**Depends on:** Phase 03 (need a project)

---

## Scope

| Area | Detail |
|------|--------|
| Frontend pages | `http://localhost:3000/projects/[id]` — Materials tab |
| API routes | `/api/projects/[id]/materials`, `/api/projects/[id]/material-requests`, `/api/projects/[id]/material-purchase`, `/api/projects/[id]/material-receipts`, `/api/projects/[id]/material-usage`, `/api/materials/[id]`, `/api/material-requests/[id]`, `/api/material-purchase/[id]`, `/api/material-receipts/[id]`, `/api/material-usage/[id]` |
| Models | `Material`, `MaterialRequest`, `MaterialPurchase`, `MaterialReceipt`, `MaterialUsage` |
| Components | `src/components/project/MaterialsTab.tsx`, `MaterialModal.tsx`, `MaterialRequestModal.tsx`, `MaterialPurchaseModal.tsx`, `MaterialReceiptModal.tsx`, `MaterialUsageModal.tsx` |

---

## Supply Chain Flow

```
[Material created] → [Request raised] → [Purchase order] → [Receipt logged] → [Usage logged]
                                                                  ↓
                                                    Material.totalReceived += qty
                                                    Material.totalConsumed += qty (on usage)
```

Inventory available = `totalReceived - totalConsumed`

---

## API Endpoints

### Materials (Inventory)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/projects/[id]/materials` | List project materials |
| POST | `/api/projects/[id]/materials` | Create material item |
| GET | `/api/materials/[id]` | Get single material (with logs) |
| PATCH | `/api/materials/[id]` | Update material |
| DELETE | `/api/materials/[id]` | Delete material |
| POST | `/api/projects/[id]/materials/bulk-action` | Bulk operations |

**Material payload:**
```json
{
  "name": "Cement OPC 53",
  "unit": "bags",
  "category": "Binding",
  "minStockLevel": 50,
  "description": "OPC 53 grade cement"
}
```

---

### Material Requests

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/projects/[id]/material-requests` | List requests |
| POST | `/api/projects/[id]/material-requests` | Create request |
| GET | `/api/material-requests/[id]` | Get single request |
| PATCH | `/api/material-requests/[id]` | Update / approve request |
| DELETE | `/api/material-requests/[id]` | Delete request |

**Request payload:**
```json
{
  "items": [
    { "materialId": "<id>", "quantity": 100 }
  ],
  "urgency": "High",
  "requiredDate": "2026-05-20",
  "note": "Needed for slab casting"
}
```

---

### Material Purchase

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/projects/[id]/material-purchase` | List purchase orders |
| POST | `/api/projects/[id]/material-purchase` | Create purchase order |
| GET | `/api/material-purchase/[id]` | Get single PO |
| PATCH | `/api/material-purchase/[id]` | Update PO |
| DELETE | `/api/material-purchase/[id]` | Delete PO |

---

### Material Receipts

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/projects/[id]/material-receipts` | List receipts |
| POST | `/api/projects/[id]/material-receipts` | Log receipt (updates inventory) |
| GET | `/api/material-receipts/[id]` | Get single receipt |
| PATCH | `/api/material-receipts/[id]` | Update receipt |
| DELETE | `/api/material-receipts/[id]` | Delete receipt |

**Receipt payload:**
```json
{
  "items": [
    { "materialId": "<id>", "quantity": 100 }
  ],
  "vendorName": "ABC Suppliers",
  "challanNumber": "CH-2026-001",
  "invoiceNumber": "INV-2026-001",
  "commonNote": "Delivered on time"
}
```
> Receipt creation immediately updates `Material.totalReceived` and adds a `"Received"` log entry.

---

### Material Usage

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/projects/[id]/material-usage` | List usage logs |
| POST | `/api/projects/[id]/material-usage` | Log usage (updates inventory) |
| GET | `/api/material-usage/[id]` | Get single usage log |
| PATCH | `/api/material-usage/[id]` | Update |
| DELETE | `/api/material-usage/[id]` | Delete |

**Usage payload:**
```json
{
  "items": [
    { "materialId": "<id>", "quantity": 20 }
  ],
  "locationOrTask": "Column casting — Grid A",
  "commonNote": "Mixed with M25 grade concrete"
}
```
> Usage creation immediately updates `Material.totalConsumed` and adds a `"Used"` log entry.

---

## Test Scenarios

### 06-A — Create a material
1. Open project → Materials tab
2. Click "Add Material"
3. Fill: Name = "Cement OPC 53", Unit = "bags", Category = "Binding", Min Stock = 50
4. **Assert:** `POST /api/projects/[id]/materials` returns `201`
5. **Assert:** Material card shows `totalReceived: 0`, `totalConsumed: 0`, available = 0

### 06-B — Low stock alert
1. After creating a material (available = 0 < minStockLevel = 50)
2. **Assert:** Low stock indicator / badge visible on the material card

### 06-C — Raise a material request
1. Click "Request Materials"
2. Select Cement OPC 53, quantity = 100, urgency = High, required date = next week
3. Submit
4. **Assert:** `POST /api/projects/[id]/material-requests` returns `201`
5. **Assert:** Request appears with status "Pending"

### 06-D — Approve material request
1. Open the request → Approve
2. **Assert:** `PATCH /api/material-requests/[id]` with `{ status: "Approved" }` returns `200`
3. **Assert:** Request status updates to "Approved"

### 06-E — Create a purchase order
1. Click "Add Purchase Order"
2. Add Cement, quantity 100, link to the approved request
3. **Assert:** `POST /api/projects/[id]/material-purchase` returns `201`

### 06-F — Log material receipt (inventory update)
1. Click "Log Receipt"
2. Add Cement, quantity = 100, vendor = "ABC Suppliers", challan = "CH-001"
3. Submit
4. **Assert:** `POST /api/projects/[id]/material-receipts` returns `201`
5. **Assert:** Cement `totalReceived` = 100 (inventory updated immediately)
6. **Assert:** Available stock = 100 (100 received - 0 consumed)
7. **Assert:** Material log has a `"Received"` entry with the challan/vendor details

### 06-G — Log material usage (inventory deduction)
1. Click "Log Usage"
2. Select Cement, quantity = 20, location = "Column casting — Grid A"
3. Submit
4. **Assert:** `POST /api/projects/[id]/material-usage` returns `201`
5. **Assert:** Cement `totalConsumed` = 20
6. **Assert:** Available stock = 80 (100 - 20)
7. **Assert:** Material log has a `"Used"` entry

### 06-H — Inventory screen
1. **Assert:** Materials list shows each material with:
   - Name, unit, category
   - totalReceived, totalConsumed, available stock
   - Low stock warning if available < minStockLevel

### 06-I — Over-consumption check
1. Try to log usage of 90 bags (would take total consumed to 110, available = -10)
2. **Assert:** Either a warning shown or backend prevents negative stock (depending on implementation)

### 06-J — Global material views
1. Open `GET /api/materials` (no project scope)
2. **Assert:** Returns materials for the entire organization
3. Navigate to finance page if it lists material costs

---

## Notes
- Receipt and Usage both have `status: "Verified"` by default — inventory is updated immediately on creation (direct receipt/usage flow, no separate verification step needed for basic testing)
- Material `logs[]` is an embedded array — each receipt/usage event appends an entry
- Bulk action endpoint: `POST /api/projects/[id]/materials/bulk-action` — useful for adjusting stock manually
