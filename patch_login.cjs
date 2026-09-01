const fs = require('fs');
let code = fs.readFileSync('src/pages/Login.tsx', 'utf8');

code = code.replace(
  "  const handleLogin = async (e: React.FormEvent) => {",
  "  const handleLogin = async (e: React.FormEvent) => {\n    localStorage.removeItem('demo_mode');"
);

fs.writeFileSync('src/pages/Login.tsx', code);

code = fs.readFileSync('src/pages/AdminLogin.tsx', 'utf8');

code = code.replace(
  "  const handleLogin = async (e: React.FormEvent) => {",
  "  const handleLogin = async (e: React.FormEvent) => {\n    localStorage.removeItem('demo_mode');"
);

fs.writeFileSync('src/pages/AdminLogin.tsx', code);
