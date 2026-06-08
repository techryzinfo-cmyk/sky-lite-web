const fs = require('fs');
let file = fs.readFileSync('app/superadmin/dashboard/page.tsx', 'utf8');

const adminSearch = /if \(loading\) \{\s*return \(\s*<div className="min-h-screen bg-\[#F8FAFF\] flex flex-col items-center justify-center p-4">\s*<Loader2 className="w-12 h-12 text-red-500 animate-spin mb-4" \/>\s*<p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Accessing System Core\.\.\.<\/p>\s*<\/div>\s*\);\s*\}/;

if (adminSearch.test(file)) {
  file = file.replace(adminSearch, 'if (loading) {\n    return <SkeletonLoader loading={true} preset="dashboard"><div /></SkeletonLoader>;\n  }');
}

if (!file.includes('SkeletonLoader')) {
  file = file.replace("'use client';", "'use client';\n\nimport { SkeletonLoader } from '@/components/ui/SkeletonLoader';");
}

fs.writeFileSync('app/superadmin/dashboard/page.tsx', file);
console.log('Fixed superadmin dashboard');
