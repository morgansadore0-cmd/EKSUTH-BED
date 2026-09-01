const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// Add imports
if (!code.includes('import Admissions')) {
  code = code.replace("import Allocation from './pages/Allocation';", "import Allocation from './pages/Allocation';\nimport Admissions from './pages/Admissions';\nimport Transfers from './pages/Transfers';\nimport Reports from './pages/Reports';\nimport Notifications from './pages/Notifications';");
}

// Replace placeholders
code = code.replace('<Route path="admissions" element={<Placeholder />} />', '<Route path="admissions" element={<Admissions />} />');
code = code.replace('<Route path="transfers" element={<Placeholder />} />', '<Route path="transfers" element={<Transfers />} />');
code = code.replace('<Route path="reports" element={<Placeholder />} />', '<Route path="reports" element={<Reports />} />');
code = code.replace('<Route path="notifications" element={<Placeholder />} />', '<Route path="notifications" element={<Notifications />} />');

fs.writeFileSync('src/App.tsx', code);
