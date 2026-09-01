const fs = require('fs');
let code = fs.readFileSync('src/pages/Beds.tsx', 'utf8');

// Import ManualRegistrationModal
code = code.replace(
  "import BedTimelineModal from '../components/Beds/BedTimelineModal';",
  "import BedTimelineModal from '../components/Beds/BedTimelineModal';\nimport ManualRegistrationModal from '../components/Beds/ManualRegistrationModal';\nimport { UserPlus } from 'lucide-react';"
);

// Add isManualRegModalOpen state
code = code.replace(
  "const [isTimelineModalOpen, setIsTimelineModalOpen] = useState(false);",
  "const [isTimelineModalOpen, setIsTimelineModalOpen] = useState(false);\n  const [isManualRegModalOpen, setIsManualRegModalOpen] = useState(false);"
);

// Add button in Bed Detail Modal (right after "Current Status" block)
const buttonHtml = `                {canEditBeds && selectedBed.status === 'AVAILABLE' && (
                  <div className="pt-3 border-t border-slate-100 mt-4">
                    <button
                      onClick={() => setIsManualRegModalOpen(true)}
                      className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"
                    >
                      <UserPlus className="w-4 h-4" />
                      Manually Register Patient
                    </button>
                    <p className="text-[10px] text-slate-500 text-center mt-2">Registers a new patient and admits them directly to this bed.</p>
                  </div>
                )}`;

code = code.replace(
  "{selectedBed.status === 'OCCUPIED' && (\n                  <p className=\"text-xs text-amber-700 bg-amber-50 p-2 rounded border border-amber-100 mt-2\">\n                    Cannot manually change status. Patient is currently admitted in this bed.\n                  </p>\n                )}\n              </div>",
  `{selectedBed.status === 'OCCUPIED' && (\n                  <p className="text-xs text-amber-700 bg-amber-50 p-2 rounded border border-amber-100 mt-2">\n                    Cannot manually change status. Patient is currently admitted in this bed.\n                  </p>\n                )}\n${buttonHtml}\n              </div>`
);

// Add ManualRegistrationModal at the end of the file
code = code.replace(
  "      {/* Timeline Modal */}",
  `      {/* Manual Registration Modal */}
      <ManualRegistrationModal
        isOpen={isManualRegModalOpen}
        onClose={() => setIsManualRegModalOpen(false)}
        bed={selectedBed}
      />

      {/* Timeline Modal */}`
);

fs.writeFileSync('src/pages/Beds.tsx', code);
