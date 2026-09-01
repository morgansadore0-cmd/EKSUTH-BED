const fs = require('fs');
let code = fs.readFileSync('src/lib/seed.ts', 'utf8');

code = code.replace("{ code: 'EMR', name: 'Emergency Ward', capacity: 30, type: 'Emergency' }", "{ code: 'EMR', name: 'Emergency Ward', capacity: 30, type: 'Emergency', floor: '1' }");
code = code.replace("{ code: 'MED-A', name: 'Medical Ward A', capacity: 35, type: 'Medical' }", "{ code: 'MED-A', name: 'Medical Ward A', capacity: 35, type: 'Medical', floor: '2' }");
code = code.replace("{ code: 'MED-B', name: 'Medical Ward B', capacity: 35, type: 'Medical' }", "{ code: 'MED-B', name: 'Medical Ward B', capacity: 35, type: 'Medical', floor: '2' }");
code = code.replace("{ code: 'SUR-A', name: 'Surgical Ward A', capacity: 30, type: 'Surgical' }", "{ code: 'SUR-A', name: 'Surgical Ward A', capacity: 30, type: 'Surgical', floor: '3' }");
code = code.replace("{ code: 'SUR-B', name: 'Surgical Ward B', capacity: 30, type: 'Surgical' }", "{ code: 'SUR-B', name: 'Surgical Ward B', capacity: 30, type: 'Surgical', floor: '3' }");
code = code.replace("{ code: 'OBG', name: 'Obstetrics & Gynaecology', capacity: 30, type: 'Maternity' }", "{ code: 'OBG', name: 'Obstetrics & Gynaecology', capacity: 30, type: 'Maternity', floor: '4' }");
code = code.replace("{ code: 'PAED', name: 'Paediatrics', capacity: 25, type: 'Paediatric' }", "{ code: 'PAED', name: 'Paediatrics', capacity: 25, type: 'Paediatric', floor: '4' }");
code = code.replace("{ code: 'ORTHO', name: 'Orthopaedics', capacity: 25, type: 'Orthopaedic' }", "{ code: 'ORTHO', name: 'Orthopaedics', capacity: 25, type: 'Orthopaedic', floor: '5' }");
code = code.replace("{ code: 'PRIV', name: 'Private Ward', capacity: 20, type: 'Private' }", "{ code: 'PRIV', name: 'Private Ward', capacity: 20, type: 'Private', floor: '5' }");
code = code.replace("{ code: 'ICU', name: 'Intensive Care Unit', capacity: 20, type: 'ICU' }", "{ code: 'ICU', name: 'Intensive Care Unit', capacity: 20, type: 'ICU', floor: '6' }");

code = code.replace("capacity: wardData.capacity,", "capacity: wardData.capacity,\\n        floor: wardData.floor || 'Unknown',");

fs.writeFileSync('src/lib/seed.ts', code);
