const fs = require('fs');
let code = fs.readFileSync('src/lib/pdfGenerator.ts', 'utf8');

const targetStr = `      ['Attending Clinician', patient.attendingClinician || 'N/A', 'Isolation Req', patient.isolationRequired ? 'Yes' : 'No']
    ];`;

const replaceStr = `      ['Attending Clinician', patient.attendingClinician || 'N/A', 'Isolation Req', patient.isolationRequired ? 'Yes' : 'No'],
      ['Diagnosis', patient.diagnosis || 'N/A', '', '']
    ];`;

code = code.replace(targetStr, replaceStr);

fs.writeFileSync('src/lib/pdfGenerator.ts', code);
