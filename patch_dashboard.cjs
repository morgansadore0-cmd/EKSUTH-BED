const fs = require('fs');
let code = fs.readFileSync('src/pages/Dashboard.tsx', 'utf8');

// 1. Import Patient type
code = code.replace(
  "import { Bed, Ward } from '../types';",
  "import { Bed, Ward, Patient } from '../types';"
);

// 2. Add state for patients
code = code.replace(
  "  const [wards, setWards] = useState<Ward[]>([]);",
  "  const [wards, setWards] = useState<Ward[]>([]);\n  const [patients, setPatients] = useState<Patient[]>([]);"
);

// 3. Fetch patients in useEffect
const useEffectOriginal = `    const unsubWards = onSnapshot(w, (snapshot) => {
      setWards(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Ward)));
    });

    return () => { unsubscribe(); unsubWards(); };`;
const useEffectNew = `    const unsubWards = onSnapshot(w, (snapshot) => {
      setWards(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Ward)));
    });

    const p = query(collection(db, getCollectionName('patients')));
    const unsubPatients = onSnapshot(p, (snapshot) => {
      setPatients(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Patient)));
    });

    return () => { unsubscribe(); unsubWards(); unsubPatients(); };`;
code = code.replace(useEffectOriginal, useEffectNew);

// 4. Calculate stats
const statsOriginal = `  const outOfServiceBeds = beds.filter(b => b.status === 'OUT_OF_SERVICE').length;`;
const statsNew = `  const outOfServiceBeds = beds.filter(b => b.status === 'OUT_OF_SERVICE').length;

  const totalRegisteredPatients = patients.length;
  const totalWardsCount = wards.length;
  const totalAdmissions = patients.filter(p => ['ADMITTED', 'DISCHARGED', 'TRANSFERRED'].includes(p.admissionStatus)).length;
  const totalDischarges = patients.filter(p => p.admissionStatus === 'DISCHARGED').length;`;
code = code.replace(statsOriginal, statsNew);

// 5. Update UI to include new stats (or replace existing stats grid with a new one that contains both)
// Let's create a new Stats Grid section for the requested stats right above or below the existing one.
const uiOriginal = `          {/* Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-4 shrink-0">
            <StatCard title="Total Capacity" value={totalBeds} color={{ title: 'text-slate-500', value: 'text-slate-900', desc: 'text-slate-400' }} />
            <StatCard title="Available" value={availableBeds} border="border-l-4 border-l-emerald-500" color={{ title: 'text-emerald-700', value: 'text-emerald-700', desc: 'text-emerald-600/60' }} desc="Ready for Admission" />
            <StatCard title="Occupied" value={occupiedBeds} border="border-l-4 border-l-red-500" color={{ title: 'text-red-700', value: 'text-red-700', desc: 'text-red-600/60' }} desc={\`\${occupancyRate}% Occupancy\`} />
            <StatCard title="Reserved" value={reservedBeds} border="border-l-4 border-l-purple-500" color={{ title: 'text-purple-700', value: 'text-purple-700', desc: 'text-purple-600/60' }} desc="Expected Arrivals" />
            <StatCard title="Maintenance" value={maintenanceBeds} border="border-l-4 border-l-orange-500" color={{ title: 'text-orange-700', value: 'text-orange-700', desc: 'text-orange-600/60' }} desc="Technical Servicing" />
            <StatCard title="Cleaning" value={cleaningBeds} border="border-l-4 border-l-blue-500" color={{ title: 'text-blue-700', value: 'text-blue-700', desc: 'text-blue-600/60' }} desc="Sanitization in Progress" />
          </div>`;

const uiNew = `          {/* Key Metrics Grid (Requested) */}
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-4 shrink-0">
            <StatCard title="Registered Patients" value={totalRegisteredPatients} border="border-l-4 border-l-indigo-500" color={{ title: 'text-indigo-700', value: 'text-indigo-700', desc: 'text-indigo-600/60' }} desc="Total in System" />
            <StatCard title="Total Wards" value={totalWardsCount} border="border-l-4 border-l-cyan-500" color={{ title: 'text-cyan-700', value: 'text-cyan-700', desc: 'text-cyan-600/60' }} desc="Active Departments" />
            <StatCard title="Available Beds" value={availableBeds} border="border-l-4 border-l-emerald-500" color={{ title: 'text-emerald-700', value: 'text-emerald-700', desc: 'text-emerald-600/60' }} desc="Ready for Admission" />
            <StatCard title="Occupied Beds" value={occupiedBeds} border="border-l-4 border-l-red-500" color={{ title: 'text-red-700', value: 'text-red-700', desc: 'text-red-600/60' }} desc={\`\${occupancyRate}% Occupancy\`} />
            <StatCard title="Total Admissions" value={totalAdmissions} border="border-l-4 border-l-amber-500" color={{ title: 'text-amber-700', value: 'text-amber-700', desc: 'text-amber-600/60' }} desc="Historical & Active" />
            <StatCard title="Total Discharges" value={totalDischarges} border="border-l-4 border-l-slate-500" color={{ title: 'text-slate-700', value: 'text-slate-700', desc: 'text-slate-600/60' }} desc="Completed Stays" />
          </div>
          
          {/* Detailed Bed Status Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 shrink-0 mt-4">
            <StatCard title="Total Capacity" value={totalBeds} color={{ title: 'text-slate-500', value: 'text-slate-900', desc: 'text-slate-400' }} />
            <StatCard title="Reserved" value={reservedBeds} border="border-l-4 border-l-purple-500" color={{ title: 'text-purple-700', value: 'text-purple-700', desc: 'text-purple-600/60' }} desc="Expected Arrivals" />
            <StatCard title="Maintenance" value={maintenanceBeds} border="border-l-4 border-l-orange-500" color={{ title: 'text-orange-700', value: 'text-orange-700', desc: 'text-orange-600/60' }} desc="Technical Servicing" />
            <StatCard title="Cleaning" value={cleaningBeds} border="border-l-4 border-l-blue-500" color={{ title: 'text-blue-700', value: 'text-blue-700', desc: 'text-blue-600/60' }} desc="Sanitization in Progress" />
          </div>`;

code = code.replace(uiOriginal, uiNew);

fs.writeFileSync('src/pages/Dashboard.tsx', code);
