const fs = require('fs');
let code = fs.readFileSync('src/pages/Patients.tsx', 'utf8');

code = code.replace(
`                          {patient.admissionStatus === 'ADMITTED' && canEditPatients && (
                            <button
                              onClick={() => setDischargingPatient(patient)}
                              className="text-red-700 bg-red-50 border border-red-200 px-3 py-1.5 rounded hover:bg-red-100 transition-colors shadow-sm"
                            >
                              Quick Discharge
                            </button>
                            <button
                              onClick={() => setTransferringPatient(patient)}
                              className="text-blue-700 bg-blue-50 border border-blue-200 px-3 py-1.5 rounded hover:bg-blue-100 transition-colors shadow-sm"
                            >
                              Quick Transfer
                            </button>
                          )}`,
`                          {patient.admissionStatus === 'ADMITTED' && canEditPatients && (
                            <>
                              <button
                                onClick={() => setDischargingPatient(patient)}
                                className="text-red-700 bg-red-50 border border-red-200 px-3 py-1.5 rounded hover:bg-red-100 transition-colors shadow-sm"
                              >
                                Quick Discharge
                              </button>
                              <button
                                onClick={() => setTransferringPatient(patient)}
                                className="text-blue-700 bg-blue-50 border border-blue-200 px-3 py-1.5 rounded hover:bg-blue-100 transition-colors shadow-sm"
                              >
                                Quick Transfer
                              </button>
                            </>
                          )}`
);

fs.writeFileSync('src/pages/Patients.tsx', code);
