const fs = require('fs');
let code = fs.readFileSync('src/pages/Beds.tsx', 'utf8');

code = code.replace("const ward = wards[bed.wardId];", "const ward = wards[bed.wardId] as any;");

fs.writeFileSync('src/pages/Beds.tsx', code);
