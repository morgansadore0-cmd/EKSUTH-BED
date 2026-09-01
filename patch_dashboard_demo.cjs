const fs = require('fs');
let code = fs.readFileSync('src/pages/Dashboard.tsx', 'utf8');

code = code.replace(
  "{isAdmin && totalBeds === 0 && !loading && (",
  "{totalBeds === 0 && !loading && ("
);

fs.writeFileSync('src/pages/Dashboard.tsx', code);
