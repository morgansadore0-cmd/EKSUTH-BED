const fs = require('fs');
let code = fs.readFileSync('src/components/Layout/DashboardLayout.tsx', 'utf8');

if (!code.includes('OfflineBanner')) {
  code = code.replace(
    "import Header from './Header';",
    "import Header from './Header';\nimport OfflineBanner from './OfflineBanner';"
  );
  
  code = code.replace(
    "        <Header onMenuClick={() => setSidebarOpen(true)} />",
    "        <OfflineBanner />\n        <Header onMenuClick={() => setSidebarOpen(true)} />"
  );
  
  fs.writeFileSync('src/components/Layout/DashboardLayout.tsx', code);
}
