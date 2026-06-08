const fs = require('fs');
let file = fs.readFileSync('src/components/project/MaterialsTab.tsx', 'utf8');

file = file.replace(/import React, \{ useState, useEffect \} from 'react';/, 
  \"import React, { useState, useEffect } from 'react';\nimport { Skeleton } from 'boneyard-js/react';\");

file = file.replace(
  /\{\s*loading \? \([\s\S]*?<p className=\"text-slate-500 font-medium\">Syncing inventory\.\.\.<\/p>[\s\S]*?\) : \(/,
  '<Skeleton loading={loading} name=\"materials-inventory\">{(!loading && materials.length > 0) || !loading ? ('
).replace(
  /<\/table>\n\s*<\/div>\n\s*\)/,
  '</table>\n            </div>\n          ) : null}</Skeleton>'
);

file = file.replace(
  /\{\s*loading \? \([\s\S]*?<p className=\"text-slate-500 font-medium\">Loading requests\.\.\.<\/p>[\s\S]*?\) : \(requests\.length > 0 \? \(/,
  '<Skeleton loading={loading} name=\"materials-requests\">{(!loading) ? (requests.length > 0 ? ('
).replace(
  /<\/div>\n\s*\)\}\n\s*<\/div>\n\s*\)\}/,
  '</div>\n          )}\n        </div>\n      )}</Skeleton>'
);

file = file.replace(
  /\{\s*loading \? \([\s\S]*?<p className=\"text-slate-500 font-medium\">Loading receipts\.\.\.<\/p>[\s\S]*?\) : \(receipts\.length > 0 \? \(/,
  '<Skeleton loading={loading} name=\"materials-receipts\">{(!loading) ? (receipts.length > 0 ? ('
).replace(
  /<\/div>\n\s*\)\}\n\s*<\/div>\n\s*\)\}/,
  '</div>\n          )}\n        </div>\n      )}</Skeleton>'
);

file = file.replace(
  /\{\s*loading \? \([\s\S]*?<p className=\"text-slate-500 font-medium\">Loading POs\.\.\.<\/p>[\s\S]*?\) : \(purchases\.length > 0 \? \(/,
  '<Skeleton loading={loading} name=\"materials-pos\">{(!loading) ? (purchases.length > 0 ? ('
).replace(
  /<\/div>\n\s*\)\}\n\s*<\/div>\n\s*\)\}/,
  '</div>\n          )}\n        </div>\n      )}</Skeleton>'
);

file = file.replace(
  /\{\s*loading \? \([\s\S]*?<p className=\"text-slate-500 font-medium\">Loading usage logs\.\.\.<\/p>[\s\S]*?\) : \(usageLogs\.length > 0 \? \(/,
  '<Skeleton loading={loading} name=\"materials-usage\">{(!loading) ? (usageLogs.length > 0 ? ('
).replace(
  /<\/div>\n\s*\)\}\n\s*<\/div>\n\s*\)\}/,
  '</div>\n          )}\n        </div>\n      )}</Skeleton>'
);

file = file.replace(
  /\{\s*activityLoading \? \([\s\S]*?<p className=\"text-slate-500 font-medium\">Loading activity\.\.\.<\/p>[\s\S]*?\) : \(activityFeed\.length > 0 \? \(/,
  '<Skeleton loading={activityLoading} name=\"materials-activity\">{(!activityLoading) ? (activityFeed.length > 0 ? ('
).replace(
  /<\/div>\n\s*\)\}\n\s*<\/div>\n\s*\)\}/,
  '</div>\n          )}\n        </div>\n      )}</Skeleton>'
);

fs.writeFileSync('src/components/project/MaterialsTab.tsx', file);
console.log('Replaced all loaders');
