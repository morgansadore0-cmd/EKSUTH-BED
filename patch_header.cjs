const fs = require('fs');
let code = fs.readFileSync('src/components/Layout/Header.tsx', 'utf8');

code = code.replace(
  '<header className="bg-white border-b border-slate-200 h-14 px-4 sm:px-6 flex items-center justify-between shrink-0 sticky top-0 z-30">',
  '<header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 h-14 px-4 sm:px-6 flex items-center justify-between shrink-0 sticky top-0 z-30">'
);
code = code.replace(
  'className="lg:hidden p-2 -ml-2 text-slate-500 hover:bg-slate-100 rounded-md mr-2"',
  'className="lg:hidden p-2 -ml-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md mr-2"'
);
code = code.replace(
  '<span className="text-xs font-medium text-slate-500">Ekiti State University Teaching Hospital</span>',
  '<span className="text-xs font-medium text-slate-500 dark:text-slate-400">Ekiti State University Teaching Hospital</span>'
);
code = code.replace(
  '<span className="text-slate-300">/</span>',
  '<span className="text-slate-300 dark:text-slate-600">/</span>'
);
code = code.replace(
  '<span className="text-xs font-bold text-slate-900">Live Capacity Dashboard</span>',
  '<span className="text-xs font-bold text-slate-900 dark:text-white">Live Capacity Dashboard</span>'
);
code = code.replace(
  '<div className="hidden sm:flex relative px-3 py-1 bg-slate-100 rounded-full items-center gap-2">',
  '<div className="hidden sm:flex relative px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-full items-center gap-2">'
);
code = code.replace(
  '<span className="text-[10px] font-bold text-slate-600 uppercase tracking-tighter">Live System Sync</span>',
  '<span className="text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-tighter">Live System Sync</span>'
);
code = code.replace(
  '<button className="relative w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors cursor-pointer">',
  '<button className="relative w-8 h-8 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer">'
);
code = code.replace(
  '<span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border border-white"></span>',
  '<span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border border-white dark:border-slate-900"></span>'
);

fs.writeFileSync('src/components/Layout/Header.tsx', code);
