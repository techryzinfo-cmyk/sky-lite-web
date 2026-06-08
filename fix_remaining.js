const fs = require('fs');

// Fix IssuesTab.tsx
let issuesFile = fs.readFileSync('src/components/project/IssuesTab.tsx', 'utf8');
const issuesSearch = /\{loading \? \(\s*<div className="flex flex-col items-center justify-center py-20">\s*<Loader2 className="w-10 h-10 text-blue-500 animate-spin mb-4" \/>\s*<p className="text-slate-500 font-medium">Syncing tracking board\.\.\.<\/p>\s*<\/div>\s*\)/;
if (issuesSearch.test(issuesFile)) {
  issuesFile = issuesFile.replace(issuesSearch, '{loading ? (\n          <SkeletonLoader loading={true} preset="list"><div /></SkeletonLoader>\n        )');
  if (!issuesFile.includes('SkeletonLoader')) {
    issuesFile = issuesFile.replace("'use client';", "'use client';\n\nimport { SkeletonLoader } from '@/components/ui/SkeletonLoader';");
  }
  fs.writeFileSync('src/components/project/IssuesTab.tsx', issuesFile);
  console.log('Fixed IssuesTab.tsx');
}

// Fix superadmin dashboard
let adminFile = fs.readFileSync('app/superadmin/dashboard/page.tsx', 'utf8');
const adminSearch = /if \(loading\) \{\s*return \(\s*<div className="min-h-screen bg-\[#F8FAFF\] flex flex-col items-center justify-center p-4">\s*<Loader2 className="w-12 h-12 text-red-500 animate-spin mb-4" \/>\s*<p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Accessing System Core\.\.\.<\/p>\s*<\/div>\s*\);\s*\}/;
if (adminSearch.test(adminFile)) {
  adminFile = adminFile.replace(adminSearch, 'if (loading) {\n    return <SkeletonLoader loading={true} preset="dashboard"><div /></SkeletonLoader>;\n  }');
  if (!adminFile.includes('SkeletonLoader')) {
    adminFile = adminFile.replace("'use client';", "'use client';\n\nimport { SkeletonLoader } from '@/components/ui/SkeletonLoader';");
  }
  fs.writeFileSync('app/superadmin/dashboard/page.tsx', adminFile);
  console.log('Fixed superadmin dashboard');
}
