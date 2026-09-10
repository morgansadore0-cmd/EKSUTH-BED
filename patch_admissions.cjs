const fs = require('fs');
let code = fs.readFileSync('src/pages/Admissions.tsx', 'utf8');

// 1. Imports
code = code.replace(
  "import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';",
  "import { collection, onSnapshot, query, orderBy, doc, writeBatch } from 'firebase/firestore';"
);

if (!code.includes("react-toastify")) {
  code = code.replace(
    "import { Link } from 'react-router-dom';",
    "import { Link } from 'react-router-dom';\nimport { toast } from 'react-toastify';"
  );
}

// 2. handleDischarge function
const handleDischargeCode = `
  const handleDischarge = async (patient: Patient) => {
    if (!window.confirm(\`Are you sure you want to discharge \${patient.fullName}?\`)) return;

    try {
      const batch = writeBatch(db);
      
      const patientRef = doc(db, getCollectionName('patients'), patient.id);
      batch.update(patientRef, {
        admissionStatus: 'DISCHARGED',
        currentBedId: null,
        currentWardId: null,
        dischargeDate: Date.now(),
        updatedAt: Date.now()
      });

      if (patient.currentBedId) {
        const bedRef = doc(db, getCollectionName('beds'), patient.currentBedId);
        batch.update(bedRef, {
          status: 'CLEANING',
          currentPatientId: null,
          updatedAt: Date.now()
        });
      }

      await batch.commit();
      toast.success(\`\${patient.fullName} has been discharged. Bed marked for cleaning.\`);
    } catch (error) {
      console.error("Error discharging patient:", error);
      toast.error("Failed to discharge patient.");
    }
  };

  const waitingPatients`;

code = code.replace("  const waitingPatients", handleDischargeCode);

// 3. UI update for recent admissions
const uiOriginal = `                      <div>
                        <p className="text-sm font-bold text-slate-900 dark:text-white">{patient.fullName}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          Admitted to Bed <span className="font-semibold text-slate-700 dark:text-slate-300">ID: {patient.currentBedId?.slice(0,6) || 'Unknown'}</span>
                        </p>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">
                          {new Date(patient.admissionDate || patient.updatedAt).toLocaleString()}
                        </p>
                      </div>`;

const uiNew = `                      <div className="flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="text-sm font-bold text-slate-900 dark:text-white">{patient.fullName}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                              Admitted to Bed <span className="font-semibold text-slate-700 dark:text-slate-300">ID: {patient.currentBedId?.slice(0,6) || 'Unknown'}</span>
                            </p>
                            <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">
                              {new Date(patient.admissionDate || patient.updatedAt).toLocaleString()}
                            </p>
                          </div>
                          <button
                            onClick={() => handleDischarge(patient)}
                            className="shrink-0 text-xs text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 px-2 py-1 rounded transition-colors"
                          >
                            Initiate Discharge
                          </button>
                        </div>
                      </div>`;

code = code.replace(uiOriginal, uiNew);

fs.writeFileSync('src/pages/Admissions.tsx', code);
