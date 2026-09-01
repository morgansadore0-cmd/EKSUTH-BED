const fs = require('fs');
let code = fs.readFileSync('src/components/Layout/Header.tsx', 'utf8');

code = code.replace(
  "  const { userData } = useAuth();",
  "  const { userData } = useAuth();\n  const isDemoMode = localStorage.getItem('demo_mode') === 'true';"
);

code = code.replace(
  '<span className="text-xs font-bold text-slate-900 dark:text-white">Live Capacity Dashboard</span>',
  '<span className="text-xs font-bold text-slate-900 dark:text-white">{isDemoMode ? "Interactive Demo Sandbox" : "Live Capacity Dashboard"}</span>'
);

code = code.replace(
  '<div className="hidden sm:flex relative px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-full items-center gap-2">',
  `{isDemoMode && (
          <div className="hidden sm:flex px-3 py-1 bg-amber-100 dark:bg-amber-900/30 rounded-full items-center border border-amber-200 dark:border-amber-800">
            <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider">Demo Mode Active</span>
          </div>
        )}
        <div className="hidden sm:flex relative px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-full items-center gap-2">`
);

fs.writeFileSync('src/components/Layout/Header.tsx', code);
