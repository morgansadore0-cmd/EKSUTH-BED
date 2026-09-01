const fs = require('fs');
let code = fs.readFileSync('src/components/Layout/Sidebar.tsx', 'utf8');

// First, remove Settings from the isAdmin block
code = code.replace(
  "    navItems.push({ name: 'Audit Logs', to: '/audit-logs', icon: ShieldAlert });\n    navItems.push({ name: 'Settings', to: '/settings', icon: Settings });",
  "    navItems.push({ name: 'Audit Logs', to: '/audit-logs', icon: ShieldAlert });"
);

// Then add it to the main navItems array
code = code.replace(
  "    { name: 'Reports', to: '/reports', icon: BarChart3 },\n    { name: 'Notifications', to: '/notifications', icon: Bell },\n  ];",
  "    { name: 'Reports', to: '/reports', icon: BarChart3 },\n    { name: 'Notifications', to: '/notifications', icon: Bell },\n    { name: 'Settings', to: '/settings', icon: Settings },\n  ];"
);

fs.writeFileSync('src/components/Layout/Sidebar.tsx', code);
