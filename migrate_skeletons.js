const fs = require('fs');
const path = require('path');

// All files that import boneyard-js
const files = [
  'src/components/dashboard/OverviewDashboard.tsx',
  'src/components/ui/CreateProjectModal.tsx',
  'src/components/ui/UserPickerModal.tsx',
  'src/components/users/UserList.tsx',
  'src/components/users/RoleList.tsx',
  'src/components/project/BOQTab.tsx',
  'src/components/project/DPRTab.tsx',
  'src/components/project/EscalationMatrixModal.tsx',
  'src/components/project/DocumentsTab.tsx',
  'src/components/project/TransactionsTab.tsx',
  'src/components/project/SurveyTab.tsx',
  'src/components/project/SendForSurveyModal.tsx',
  'src/components/project/RisksTab.tsx',
  'src/components/project/PlansTab.tsx',
  'src/components/project/MilestonesTab.tsx',
  'src/components/project/MaterialsTab.tsx',
  'src/components/templates/TemplateList.tsx',
  'src/components/templates/TemplateDetailModal.tsx',
  'src/components/project/BOQHistoryModal.tsx',
  'src/components/templates/CategoryList.tsx',
  'src/components/project/BOQApproversModal.tsx',
  'src/components/project/TimelineTab.tsx',
  'app/projects/page.tsx',
  'app/projects/[id]/page.tsx',
  'app/projects/[id]/milestones/[milestoneId]/page.tsx',
  'app/finance/page.tsx',
];

// Map file to a preset based on what it is
const presetMap = {
  'OverviewDashboard.tsx': 'dashboard',
  'CreateProjectModal.tsx': 'modal',
  'UserPickerModal.tsx': 'modal',
  'UserList.tsx': 'list',
  'RoleList.tsx': 'list',
  'BOQTab.tsx': 'table',
  'DPRTab.tsx': 'list',
  'EscalationMatrixModal.tsx': 'modal',
  'DocumentsTab.tsx': 'list',
  'TransactionsTab.tsx': 'table',
  'SurveyTab.tsx': 'list',
  'SendForSurveyModal.tsx': 'modal',
  'RisksTab.tsx': 'list',
  'PlansTab.tsx': 'list',
  'MilestonesTab.tsx': 'list',
  'MaterialsTab.tsx': 'table',
  'TemplateList.tsx': 'card-grid',
  'TemplateDetailModal.tsx': 'modal',
  'BOQHistoryModal.tsx': 'modal',
  'CategoryList.tsx': 'list',
  'BOQApproversModal.tsx': 'modal',
  'TimelineTab.tsx': 'list',
  'page.tsx': 'card-grid', // projects page default
};

let changed = 0;
let skipped = 0;

for (const relPath of files) {
  const fullPath = path.resolve(relPath);
  if (!fs.existsSync(fullPath)) {
    console.log(`SKIP (not found): ${relPath}`);
    skipped++;
    continue;
  }
  
  let content = fs.readFileSync(fullPath, 'utf8');
  const original = content;
  const basename = path.basename(relPath);
  
  // Determine relative import path for SkeletonLoader
  const fileDir = path.dirname(fullPath);
  const skeletonPath = path.resolve('src/components/ui/SkeletonLoader');
  let importPath = path.relative(fileDir, skeletonPath).replace(/\\/g, '/');
  if (!importPath.startsWith('.')) importPath = './' + importPath;
  // For app/ files, use @/ alias
  if (relPath.startsWith('app/')) {
    importPath = '@/components/ui/SkeletonLoader';
  }

  // Step 1: Replace boneyard import with SkeletonLoader import
  content = content.replace(
    /import\s*\{[^}]*Skeleton[^}]*\}\s*from\s*['"]boneyard-js\/react['"];?\r?\n/g,
    `import { SkeletonLoader } from '${importPath}';\n`
  );
  
  // Step 2: Determine which preset to use
  const preset = presetMap[basename] || 'list';
  
  // Handle detail pages specifically
  let effectivePreset = preset;
  if (relPath.includes('[id]/page.tsx') && !relPath.includes('milestones')) {
    effectivePreset = 'detail';
  }
  if (relPath.includes('milestones/[milestoneId]/page.tsx')) {
    effectivePreset = 'detail';
  }
  if (relPath.includes('finance/page.tsx')) {
    effectivePreset = 'form';
  }
  if (relPath.includes('app/projects/page.tsx')) {
    effectivePreset = 'card-grid';
  }
  
  // Step 3: Replace <Skeleton loading={...} name="..."> with <SkeletonLoader loading={...} preset="...">
  // Handle various patterns
  content = content.replace(
    /<Skeleton\s+loading=\{([^}]+)\}\s+name="[^"]*"\s*>/g,
    `<SkeletonLoader loading={$1} preset="${effectivePreset}">`
  );
  
  // Also handle name first then loading
  content = content.replace(
    /<Skeleton\s+name="[^"]*"\s+loading=\{([^}]+)\}\s*>/g,
    `<SkeletonLoader loading={$1} preset="${effectivePreset}">`
  );
  
  // Replace closing tags
  content = content.replace(/<\/Skeleton>/g, '</SkeletonLoader>');
  
  if (content !== original) {
    fs.writeFileSync(fullPath, content);
    console.log(`UPDATED: ${relPath} (preset: ${effectivePreset})`);
    changed++;
  } else {
    console.log(`NO CHANGE: ${relPath}`);
    skipped++;
  }
}

console.log(`\nDone: ${changed} files updated, ${skipped} skipped.`);
