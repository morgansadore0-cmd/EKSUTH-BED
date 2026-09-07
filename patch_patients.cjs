const fs = require('fs');
let code = fs.readFileSync('src/pages/Patients.tsx', 'utf8');

if (!code.includes('import QuickTransferModal')) {
  code = code.replace(
    "import { useNavigate } from 'react-router-dom';",
    "import { useNavigate } from 'react-router-dom';\nimport QuickTransferModal from '../components/Patients/QuickTransferModal';"
  );
  
  code = code.replace(
    "const [dischargingPatient, setDischargingPatient] = useState<Patient | null>(null);",
    "const [dischargingPatient, setDischargingPatient] = useState<Patient | null>(null);\n  const [transferringPatient, setTransferringPatient] = useState<Patient | null>(null);"
  );
  
  code = code.replace(
    " Quick Discharge",
    " Quick Discharge\n                            </button>\n                            <button\n                              onClick={() => setTransferringPatient(patient)}\n                              className=\"text-blue-700 bg-blue-50 border border-blue-200 px-3 py-1.5 rounded hover:bg-blue-100 transition-colors shadow-sm\"\n                            >\n                              Quick Transfer"
  );
  
  code = code.replace(
    "    </div>",
    "      {transferringPatient && (\n        <QuickTransferModal \n          patient={transferringPatient} \n          onClose={() => setTransferringPatient(null)} \n        />\n      )}\n    </div>"
  );
  
  fs.writeFileSync('src/pages/Patients.tsx', code);
}
