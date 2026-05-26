const fs = require('fs');
const cp = require('child_process');

const files = [
  'src/components/dashboard/OverviewDashboard.tsx',
  'src/components/project/BOQApproversModal.tsx',
  'src/components/project/BOQHistoryModal.tsx',
  'src/components/project/BOQTab.tsx',
  'src/components/project/DPRTab.tsx',
  'src/components/project/DocumentsTab.tsx',
  'src/components/project/EscalationMatrixModal.tsx',
  'src/components/project/MilestonesTab.tsx',
  'src/components/project/PlansTab.tsx',
  'src/components/project/RisksTab.tsx',
  'src/components/project/SendForSurveyModal.tsx',
  'src/components/project/SurveyTab.tsx',
  'src/components/project/TimelineTab.tsx',
  'src/components/project/TransactionsTab.tsx',
  'src/components/templates/CategoryList.tsx',
  'src/components/templates/TemplateDetailModal.tsx',
  'src/components/templates/TemplateList.tsx',
  'src/components/ui/CreateProjectModal.tsx',
  'src/components/ui/UserPickerModal.tsx',
  'src/components/users/RoleList.tsx',
  'src/components/users/UserList.tsx'
];

files.forEach(f => {
  try {
    let content = fs.readFileSync(f, 'utf8');
    content = content.replace(/from 'boneyard-js'/g, "from 'boneyard-js/react'");
    fs.writeFileSync(f, content);
    console.log(`Replaced in ${f}`);
  } catch(e) {
    console.error(`Failed ${f}`);
  }
});
