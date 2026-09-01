const fs = require('fs');
const files = [
  'src/components/Beds/BedHistoryLog.tsx',
  'src/components/Beds/BedTimelineModal.tsx',
  'src/components/Beds/ManualRegistrationModal.tsx',
  'src/components/Dashboard/StaffStats.tsx',
  'src/hooks/useMaintenanceMonitor.ts',
  'src/lib/seed.ts',
  'src/pages/Allocation.tsx',
  'src/pages/AuditLogs.tsx',
  'src/pages/Beds.tsx',
  'src/pages/Dashboard.tsx',
  'src/pages/Patients.tsx',
  'src/pages/PendingApprovals.tsx',
  'src/pages/Register.tsx',
  'src/pages/Staff.tsx',
  'src/pages/StaffRegistry.tsx',
  'src/pages/Wards.tsx'
];

for (const file of files) {
  let code = fs.readFileSync(file, 'utf8');
  
  if (code.includes('getCollectionName') && !code.includes('getCollectionName } from')) {
    // Find the import for firebase/config
    const importRegex = /import\s*\{([^}]*)\}\s*from\s*['"]((?:\.\.\/)*firebase\/config)['"];/g;
    
    let matched = false;
    code = code.replace(importRegex, (match, imports, path) => {
      matched = true;
      if (!imports.includes('getCollectionName')) {
         return `import { ${imports.trim()}, getCollectionName } from '${path}';`;
      }
      return match;
    });

    if (!matched) {
      // Just add it to the top
      // count depth by path level or just guess
      const depth = file.split('/').length - 2;
      const relativePath = depth === 0 ? './firebase/config' : '../'.repeat(depth) + 'firebase/config';
      code = `import { getCollectionName } from '${relativePath}';\n` + code;
    }
    
    fs.writeFileSync(file, code);
  }
}
