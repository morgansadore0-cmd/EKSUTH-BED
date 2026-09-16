const fs = require('fs');
let code = fs.readFileSync('src/pages/Patients.tsx', 'utf8');

const targetStr = `<div className="absolute inset-0 bg-gray-900 bg-opacity-75 transition-opacity" onClick={() => setShowForm(false)} />`;

const replaceStr = `<div className="absolute inset-0 bg-gray-900 bg-opacity-80 transition-opacity backdrop-blur-sm" onClick={() => setShowForm(false)} />
            
            {/* Informational write-up on the left side of the slide-over */}
            <div className="hidden lg:flex absolute inset-y-0 left-0 right-auto w-[calc(100%-28rem)] items-center justify-center p-12 pointer-events-none">
              <div className="text-white space-y-6 max-w-lg">
                <div className="inline-flex items-center gap-2 bg-emerald-500/20 text-emerald-300 px-3 py-1 rounded-full text-sm font-medium border border-emerald-500/30">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  Secure Registration
                </div>
                <h2 className="text-4xl font-bold tracking-tight">Patient Intake Portal</h2>
                <p className="text-lg text-slate-300 leading-relaxed">
                  Please ensure all patient information is entered accurately. 
                  This data directly impacts clinical bed allocation, priority triaging, 
                  and the generation of official admission medical records.
                </p>
                <div className="grid grid-cols-2 gap-6 pt-6 border-t border-slate-700/50">
                  <div>
                    <h4 className="text-emerald-400 font-semibold mb-1">Privacy First</h4>
                    <p className="text-sm text-slate-400">All data is encrypted and securely stored in compliance with medical data regulations.</p>
                  </div>
                  <div>
                    <h4 className="text-emerald-400 font-semibold mb-1">Instant Sync</h4>
                    <p className="text-sm text-slate-400">Records are immediately synchronized across all hospital wards and clinician devices.</p>
                  </div>
                </div>
              </div>
            </div>`;

code = code.replace(targetStr, replaceStr);

fs.writeFileSync('src/pages/Patients.tsx', code);
