# Phase 08 — Templates & Categories

**Status:** ⬜ Not Started  
**Depends on:** Phase 01 (auth only)

---

## Scope

| Area | Detail |
|------|--------|
| Frontend pages | `http://localhost:3000/templates` |
| API routes | `/api/template-categories`, `/api/template-categories/[id]`, `/api/templates`, `/api/templates/[id]` |
| Models | `Template`, `TemplateCategory` |
| Components | `src/components/templates/TemplateList.tsx`, `TemplateModal.tsx`, `TemplateDetailModal.tsx`, `CategoryList.tsx` |

---

## API Endpoints

### Template Categories

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/template-categories` | List all categories |
| POST | `/api/template-categories` | Create category |
| GET | `/api/template-categories/[id]` | Get single category |
| PATCH | `/api/template-categories/[id]` | Update category |
| DELETE | `/api/template-categories/[id]` | Delete category |

**Category payload:**
```json
{ "name": "Residential", "description": "Residential construction projects" }
```

---

### Templates

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/templates` | List all templates |
| POST | `/api/templates` | Create template |
| GET | `/api/templates/[id]` | Get single template (for detail view) |
| PATCH | `/api/templates/[id]` | Update template |
| DELETE | `/api/templates/[id]` | Delete template |

**Template create payload:**
```json
{
  "name": "3BHK Villa Standard",
  "description": "Standard 3BHK villa construction template with typical cost ranges",
  "category": "<categoryId>",
  "minBudget": 4000000,
  "maxBudget": 7000000,
  "area": 2200,
  "estimatedDays": 180,
  "images": ["https://res.cloudinary.com/..."],
  "files": [
    { "name": "Foundation Plan.pdf", "url": "https://res.cloudinary.com/...", "size": 204800 }
  ]
}
```

---

## Data Mapping (Frontend → API)

| Frontend Field | API Field | Type | Notes |
|----------------|-----------|------|-------|
| Template name | `name` | string | required |
| Category pill | `category` | ObjectId | ref to TemplateCategory |
| Min budget | `minBudget` | number | in ₹ |
| Max budget | `maxBudget` | number | in ₹ |
| Area | `area` | number | in sqft |
| Timeline | `estimatedDays` | number | days |
| Cover image | `images[0]` | string URL | Cloudinary |
| All images | `images[]` | string[] | Cloudinary URLs |
| Plan files | `files[]` | `{ name, url, size }[]` | Cloudinary |

**Card display mapping:**
- Budget: `₹${(minBudget/100000).toFixed(0)}L – ₹${(maxBudget/100000).toFixed(0)}L`
- Area: `${area.toLocaleString()} sqft`
- Days: `${estimatedDays}d`
- Cover: `images[0]` as `<img>` with `object-cover`, fallback = gradient + Layers icon

---

## Test Scenarios

### 08-A — Template Categories tab
1. Open `http://localhost:3000/templates` → Categories section
2. **Assert:** Empty state or existing categories visible
3. Create a category: "Residential"
4. **Assert:** `POST /api/template-categories` returns `201`
5. **Assert:** Category appears in list

### 08-B — Create a template
1. Click "Create Project Template"
2. Fill in:
   - Name: "3BHK Villa Standard"
   - Category: Select "Residential"
   - Min Budget: 40,00,000, Max Budget: 70,00,000
   - Area: 2200 sqft
   - Timeline: 180 days
   - Description: short text
3. Upload at least 1 Reference Image (Cloudinary)
4. Upload 1 Plan File PDF (Cloudinary)
5. Save
6. **Assert:** `POST /api/templates` returns `201`
7. **Assert:** Template card appears in the grid

### 08-C — Template card cover image
1. **Assert:** The uploaded image appears as the card cover (not the Layers fallback icon)
2. **Assert:** Category badge overlaid on the image (top-left)
3. **Assert:** Stats row shows: Budget `₹40L–₹70L`, Area `2,200 sqft`, Days `180d`
4. **Assert:** Image count badge shows "1 photos"
5. **Assert:** Files count shows "1 files"

### 08-D — Template card 3-dot menu
1. Click the `⋮` menu on a template card
2. **Assert:** Three options visible: "View Template", "Edit Details", "Delete Template"
3. **Assert:** NO "Duplicate" option (removed)

### 08-E — View Template detail modal
1. Click "View Template" from menu (or click the card)
2. **Assert:** `GET /api/templates/[id]` called
3. **Assert:** Detail modal shows:
   - Hero card with category pill and template name
   - Budget range: `₹40,00,000 – ₹70,00,000` (full number, not Lakh abbreviation)
   - Est. Area: `2,200 sqft`
   - Timeline: `180 days`
   - Photos section with horizontal scroll gallery
   - Plan Files section with name, size, download button
4. **Assert:** "Edit Template" button in footer

### 08-F — Edit Template
1. From detail modal → "Edit Template" OR from card menu → "Edit Details"
2. **Assert:** Edit modal pre-populates ALL fields (name, category, budget, area, days, description, existing images, existing files)
3. Change name → "3BHK Villa Premium"
4. Add another image
5. Save
6. **Assert:** `PATCH /api/templates/[id]` returns `200`
7. **Assert:** Card updates with new name and new image count

### 08-G — Delete Template
1. Click "Delete Template" from 3-dot menu
2. Confirm in browser confirm dialog
3. **Assert:** `DELETE /api/templates/[id]` returns `200`
4. **Assert:** Template removed from grid

### 08-H — Search templates
1. Type part of a template name in the search box
2. **Assert:** Grid filters to matching templates only
3. Clear search → all templates visible

### 08-I — Pagination
1. Create more than 9 templates
2. **Assert:** Pagination controls appear
3. **Assert:** Page 2 shows remaining templates

### 08-J — Use template in project creation
1. Open `http://localhost:3000/projects` → New Project
2. **Assert:** Template selector visible in the project creation form
3. Select "3BHK Villa Premium" template
4. **Assert:** Budget, area, timeline pre-filled from template
5. Create the project
6. **Assert:** Project created with template's default values

---

## Known Fixes Applied
- `TemplateList.tsx`: Cover image now reads `template.images?.[0]` (was showing Layers icon always)
- `TemplateList.tsx`: 3-dot menu shows View / Edit / Delete (Duplicate option removed)
- `TemplateList.tsx`: Stats correctly map `minBudget`, `maxBudget`, `area`, `estimatedDays`
- `TemplateModal.tsx`: Edit mode pre-populates all fields including `images[]` and `files[]`
- `TemplateModal.tsx`: Uses `PATCH /templates/[id]` when `templateId` prop is present
- `TemplateDetailModal.tsx`: Rewritten to match mobile — hero card, 3-col stats, image gallery, plan files list

---

## Notes
- Images are Cloudinary URLs stored as `string[]` in the `images` field
- Plan files are stored as `{ name, url, size }[]` in the `files` field
- Template categories are shared across the organization (not project-scoped)
- Templates themselves are org-scoped (not global across orgs)
