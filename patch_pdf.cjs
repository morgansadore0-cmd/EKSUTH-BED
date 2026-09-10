const fs = require('fs');
let code = fs.readFileSync('src/pages/Patients.tsx', 'utf8');

// 1. Add FileText to lucide-react imports
code = code.replace(
  "import { Search, Plus, X, Download } from 'lucide-react';",
  "import { Search, Plus, X, Download, FileText } from 'lucide-react';"
);

// 2. Add generatePatientPDF import
code = code.replace(
  "import QuickTransferModal from '../components/Patients/QuickTransferModal';",
  "import QuickTransferModal from '../components/Patients/QuickTransferModal';\nimport { generatePatientPDF } from '../lib/pdfGenerator';"
);

// 3. Add PDF button
const replaceActionsOrig = `                            <>
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
                            </>`;
                            
const replaceActionsNew = `                            <>
                              <button
                                onClick={() => generatePatientPDF(patient)}
                                className="text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded hover:bg-emerald-100 transition-colors shadow-sm flex items-center gap-1"
                              >
                                <FileText className="w-3.5 h-3.5" /> PDF Summary
                              </button>
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
                            </>`;

code = code.replace(replaceActionsOrig, replaceActionsNew);

fs.writeFileSync('src/pages/Patients.tsx', code);
