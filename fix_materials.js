const fs = require('fs');

let file = fs.readFileSync('src/components/project/MaterialsTab.tsx', 'utf8');

// Replace all loading ternary patterns:
//   {loading ? (
//     <div ...><Loader2 .../>Loading X...</div>
//   ) : content
// with:
//   {loading ? (
//     <SkeletonLoader loading={true} preset="table"><div/></SkeletonLoader>
//   ) : content

// Pattern: {loading ? ( ... Loader2 ... Loading XYZ... ... ) : 
// We'll replace each one individually

const replacements = [
  {
    search: /\{loading \? \(\s*<div className="flex flex-col items-center justify-center py-20">\s*<Loader2 className="w-10 h-10 text-blue-500 animate-spin mb-4" \/>\s*<p className="text-slate-500 font-medium">Loading requests\.\.\.<\/p>\s*<\/div>\s*\)/,
    replace: '{loading ? (\n            <SkeletonLoader loading={true} preset="card-grid"><div /></SkeletonLoader>\n          )'
  },
  {
    search: /\{loading \? \(\s*<div className="flex flex-col items-center justify-center py-20">\s*<Loader2 className="w-10 h-10 text-blue-500 animate-spin mb-4" \/>\s*<p className="text-slate-500 font-medium">Loading receipts\.\.\.<\/p>\s*<\/div>\s*\)/,
    replace: '{loading ? (\n            <SkeletonLoader loading={true} preset="table"><div /></SkeletonLoader>\n          )'
  },
  {
    search: /\{loading \? \(\s*<div className="flex flex-col items-center justify-center py-20">\s*<Loader2 className="w-10 h-10 text-blue-500 animate-spin mb-4" \/>\s*<p className="text-slate-500 font-medium">Loading POs\.\.\.<\/p>\s*<\/div>\s*\)/,
    replace: '{loading ? (\n            <SkeletonLoader loading={true} preset="card-grid"><div /></SkeletonLoader>\n          )'
  },
  {
    search: /\{loading \? \(\s*<div className="flex flex-col items-center justify-center py-20">\s*<Loader2 className="w-10 h-10 text-blue-500 animate-spin mb-4" \/>\s*<p className="text-slate-500 font-medium">Loading usage logs\.\.\.<\/p>\s*<\/div>\s*\)/,
    replace: '{loading ? (\n            <SkeletonLoader loading={true} preset="table"><div /></SkeletonLoader>\n          )'
  },
  {
    search: /\{activityLoading \? \(\s*<div className="flex flex-col items-center justify-center py-20">\s*<Loader2 className="w-10 h-10 text-blue-500 animate-spin mb-4" \/>\s*<p className="text-slate-500 font-medium">Loading activity\.\.\.<\/p>\s*<\/div>\s*\)/,
    replace: '{activityLoading ? (\n            <SkeletonLoader loading={true} preset="list"><div /></SkeletonLoader>\n          )'
  },
];

let count = 0;
for (const r of replacements) {
  if (r.search.test(file)) {
    file = file.replace(r.search, r.replace);
    count++;
    console.log('Replaced: ' + r.replace.substring(0, 60));
  } else {
    console.log('NOT FOUND: ' + r.search.source.substring(0, 60));
  }
}

// Make sure SkeletonLoader is imported
if (!file.includes("import { SkeletonLoader }")) {
  file = file.replace(
    "import { Skeleton } from 'boneyard-js/react';",
    "import { SkeletonLoader } from '../ui/SkeletonLoader';"
  );
  // If already replaced by migration script, ensure it's there
  if (!file.includes("SkeletonLoader")) {
    // Add import after 'use client'
    file = file.replace("'use client';", "'use client';\n\nimport { SkeletonLoader } from '../ui/SkeletonLoader';");
  }
}

fs.writeFileSync('src/components/project/MaterialsTab.tsx', file);
console.log(`\nDone. ${count} replacements made.`);
