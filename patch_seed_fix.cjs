const fs = require('fs');
let code = fs.readFileSync('src/lib/seed.ts', 'utf8');

code = code.replace("capacity: wardData.capacity,\\n        floor: wardData.floor || 'Unknown',", "capacity: wardData.capacity,\n        floor: (wardData as any).floor || 'Unknown',");

fs.writeFileSync('src/lib/seed.ts', code);
