const fs = require('fs');
let code = fs.readFileSync('src/pages/Dashboard.tsx', 'utf8');

if (!code.includes('import UrgentAlerts')) {
  code = code.replace(
    "import MaintenanceAlert from '../components/Dashboard/MaintenanceAlert';",
    "import MaintenanceAlert from '../components/Dashboard/MaintenanceAlert';\nimport UrgentAlerts from '../components/Dashboard/UrgentAlerts';"
  );
  
  code = code.replace(
    "{!loading && <MaintenanceAlert beds={beds} />}",
    "{!loading && <UrgentAlerts />}\n      {!loading && <MaintenanceAlert beds={beds} />}"
  );
  
  fs.writeFileSync('src/pages/Dashboard.tsx', code);
}
