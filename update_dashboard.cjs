const fs = require('fs');
let code = fs.readFileSync('src/pages/Dashboard.tsx', 'utf8');

// Add Ward import
code = code.replace(
  "import { Bed } from '../types';",
  "import { Bed, Ward } from '../types';"
);

// Add wards state
code = code.replace(
  "const [beds, setBeds] = useState<Bed[]>([]);",
  "const [beds, setBeds] = useState<Bed[]>([]);\n  const [wards, setWards] = useState<Ward[]>([]);"
);

// Fetch wards
code = code.replace(
  "    const q = query(collection(db, 'beds'));\n    const unsubscribe = onSnapshot(q, (snapshot) => {\n      const bedsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Bed));\n      setBeds(bedsData);\n      setLoading(false);\n    }, (error) => {\n      console.error(error);\n      toast.error(\"Failed to load live hospital data\");\n    });\n\n    return () => unsubscribe();",
  `    const q = query(collection(db, 'beds'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const bedsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Bed));
      setBeds(bedsData);
      setLoading(false);
    }, (error) => {
      console.error(error);
      toast.error("Failed to load live hospital data");
    });

    const w = query(collection(db, 'wards'));
    const unsubWards = onSnapshot(w, (snapshot) => {
      setWards(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Ward)));
    });

    return () => { unsubscribe(); unsubWards(); };`
);

// Calculate department stats
const statsCode = `
  const departmentStats = wards.map(ward => {
    const wardBeds = beds.filter(b => b.wardId === ward.id);
    const available = wardBeds.filter(b => b.status === 'AVAILABLE').length;
    const occupied = wardBeds.filter(b => b.status === 'OCCUPIED').length;
    const total = wardBeds.length;
    const rate = total > 0 ? Math.round((occupied / total) * 100) : 0;
    return { name: ward.name, type: ward.type, available, occupied, total, rate };
  }).sort((a, b) => b.available - a.available);
`;

code = code.replace(
  "  const chartData = [",
  statsCode + "\n  const chartData = ["
);

// Render department stats section
const renderDepartmentCode = `
          {/* Department Breakdown */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Department Capacity Breakdown</h3>
                <p className="text-sm text-gray-500 mt-1">Available beds across all hospital wards</p>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-gray-50 text-gray-500 font-medium">
                  <tr>
                    <th className="px-6 py-3">Department (Ward)</th>
                    <th className="px-6 py-3 text-center">Type</th>
                    <th className="px-6 py-3 text-right">Available Beds</th>
                    <th className="px-6 py-3 text-right">Total Beds</th>
                    <th className="px-6 py-3 text-right">Occupancy</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {departmentStats.map((dept, idx) => (
                    <tr key={idx} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 font-medium text-gray-900">{dept.name}</td>
                      <td className="px-6 py-4 text-center text-gray-500">{dept.type}</td>
                      <td className="px-6 py-4 text-right">
                        <span className={clsx("inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-medium", dept.available > 0 ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800")}>
                          {dept.available}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right text-gray-500">{dept.total}</td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <span className="text-gray-900">{dept.rate}%</span>
                          <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                            <div className={clsx("h-full rounded-full", dept.rate > 90 ? "bg-red-500" : dept.rate > 75 ? "bg-orange-500" : "bg-emerald-500")} style={{ width: \`\${dept.rate}%\` }}></div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {departmentStats.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-gray-500">No departments found</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
`;

code = code.replace(
  "          {isAdmin && <StaffStats />}",
  renderDepartmentCode + "\n          {isAdmin && <StaffStats />}"
);

fs.writeFileSync('src/pages/Dashboard.tsx', code);
