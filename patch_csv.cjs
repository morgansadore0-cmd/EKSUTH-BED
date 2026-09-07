const fs = require('fs');
let code = fs.readFileSync('src/pages/Patients.tsx', 'utf8');

// 1. Import Download
code = code.replace(
  "import { Search, Plus, X } from 'lucide-react';",
  "import { Search, Plus, X, Download } from 'lucide-react';"
);

// 2. Add exportToCSV
const exportCode = `
  const exportToCSV = () => {
    const admittedPatients = patients.filter(p => p.admissionStatus === 'ADMITTED');
    if (admittedPatients.length === 0) {
      toast.info("No admitted patients to export.");
      return;
    }
    
    const headers = ['MRN', 'Full Name', 'Age', 'Gender', 'Phone', 'Priority', 'Admission Date'];
    const rows = admittedPatients.map(p => [
      p.mrn,
      \`"\${p.fullName}"\`,
      p.age,
      p.gender,
      p.phone,
      p.priority,
      p.admissionDate ? new Date(p.admissionDate).toLocaleString() : 'N/A'
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(e => e.join(','))
    ].join('\\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', \`admitted_patients_\${new Date().toISOString().split('T')[0]}.csv\`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    toast.success("Exported admitted patients to CSV.");
  };

  const handleQuickDischarge`;

code = code.replace("  const handleQuickDischarge", exportCode);

// 3. Update top actions
const topActionsOrig = `        <div>
          <h1 className="text-2xl font-bold text-gray-900">Patient Management</h1>
          <p className="text-sm text-gray-500 mt-1">Register and view patient records</p>
        </div>
        {canEditPatients && (
          <button 
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 shadow-sm transition-colors text-sm font-medium"
          >
            <Plus className="w-4 h-4" /> Register Patient
          </button>
        )}`;

const topActionsNew = `        <div>
          <h1 className="text-2xl font-bold text-gray-900">Patient Management</h1>
          <p className="text-sm text-gray-500 mt-1">Register and view patient records</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={exportToCSV}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white text-slate-700 border border-slate-300 rounded-md hover:bg-slate-50 shadow-sm transition-colors text-sm font-medium"
          >
            <Download className="w-4 h-4" /> Export CSV
          </button>
          {canEditPatients && (
            <button 
              onClick={() => setShowForm(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 shadow-sm transition-colors text-sm font-medium"
            >
              <Plus className="w-4 h-4" /> Register Patient
            </button>
          )}
        </div>`;

code = code.replace(topActionsOrig, topActionsNew);

fs.writeFileSync('src/pages/Patients.tsx', code);
