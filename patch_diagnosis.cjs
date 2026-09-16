const fs = require('fs');
let code = fs.readFileSync('src/pages/Patients.tsx', 'utf8');

// 1. Initial State
code = code.replace(
  "    attendingClinician: ''",
  "    attendingClinician: '',\n    diagnosis: ''"
);

// 2. Payload
code = code.replace(
  "        attendingClinician: formData.attendingClinician,",
  "        attendingClinician: formData.attendingClinician,\n        diagnosis: formData.diagnosis,"
);

// 3. Reset form
code = code.replace(
  "        attendingClinician: ''\n      });",
  "        attendingClinician: '',\n        diagnosis: ''\n      });"
);

// 4. Form HTML - insert it before Emergency Contact or Priority. Let's insert it right after the Phone/Priority grid.
const targetHTML = `                      <div>
                        <label className="block text-sm font-medium text-gray-700">Emergency Contact</label>`;

const replacementHTML = `                      <div>
                        <label className="block text-sm font-medium text-gray-700">Diagnosis / Chief Complaint</label>
                        <input type="text" required className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 sm:text-sm" value={formData.diagnosis} onChange={(e) => setFormData({...formData, diagnosis: e.target.value})} />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">Emergency Contact</label>`;

code = code.replace(targetHTML, replacementHTML);

fs.writeFileSync('src/pages/Patients.tsx', code);
