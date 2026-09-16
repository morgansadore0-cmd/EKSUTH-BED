const fs = require('fs');
let code = fs.readFileSync('src/pages/Reports.tsx', 'utf8');

// 1. Add generateHospitalReportPDF import
code = code.replace(
  "import { TrendingUp, Users, Activity, BedDouble } from 'lucide-react';",
  "import { TrendingUp, Users, Activity, BedDouble, Download } from 'lucide-react';\nimport { generateHospitalReportPDF } from '../lib/pdfGenerator';"
);

// 2. Add Download button next to title
const headerOrig = `      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Hospital Capacity Reports</h1>
        <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">Analytics and historical occupancy trends</p>
      </div>`;

const headerNew = `      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Hospital Capacity Reports</h1>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">Analytics and historical occupancy trends</p>
        </div>
        <button
          onClick={() => generateHospitalReportPDF(beds, wards, patients)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 shadow-sm transition-colors text-sm font-medium shrink-0"
        >
          <Download className="w-4 h-4" /> Download Report
        </button>
      </div>`;

code = code.replace(headerOrig, headerNew);

fs.writeFileSync('src/pages/Reports.tsx', code);
