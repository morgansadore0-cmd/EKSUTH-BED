const fs = require('fs');
let code = fs.readFileSync('src/pages/Patients.tsx', 'utf8');

// 1. Initial State
code = code.replace(
  "    dob: '',",
  "    dob: '',\n    registrationDate: new Date().toISOString().split('T')[0],"
);

// 2. Payload
code = code.replace(
  "        dischargeDate: null,",
  "        dischargeDate: null,\n        registrationDate: formData.registrationDate,"
);

// 3. Reset form
code = code.replace(
  "        dob: '',\n        phone: '',",
  "        dob: '',\n        registrationDate: new Date().toISOString().split('T')[0],\n        phone: '',"
);

// 4. Form HTML
const targetHTML = `                      <div>
                        <label className="block text-sm font-medium text-gray-700">Full Name</label>
                        <input type="text" required className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 sm:text-sm" value={formData.fullName} onChange={(e) => setFormData({...formData, fullName: e.target.value})} />
                      </div>`;

const replacementHTML = `                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Full Name</label>
                          <input type="text" required className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 sm:text-sm" value={formData.fullName} onChange={(e) => setFormData({...formData, fullName: e.target.value})} />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Registration Date</label>
                          <input type="date" required className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 sm:text-sm" value={formData.registrationDate} onChange={(e) => setFormData({...formData, registrationDate: e.target.value})} />
                        </div>
                      </div>`;

code = code.replace(targetHTML, replacementHTML);

fs.writeFileSync('src/pages/Patients.tsx', code);
