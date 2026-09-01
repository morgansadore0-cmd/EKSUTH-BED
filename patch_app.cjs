const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  "import { AuthProvider } from './contexts/AuthContext';",
  "import { AuthProvider } from './contexts/AuthContext';\nimport { ThemeProvider } from './contexts/ThemeContext';"
);

code = code.replace(
  "import Placeholder from './pages/Placeholder';",
  "import Placeholder from './pages/Placeholder';\nimport Settings from './pages/Settings';"
);

code = code.replace(
  "<AuthProvider>",
  "<ThemeProvider>\n    <AuthProvider>"
);

code = code.replace(
  "</AuthProvider>",
  "</AuthProvider>\n    </ThemeProvider>"
);

code = code.replace(
  '<Route path="settings" element={<Placeholder />} />',
  '<Route path="settings" element={<Settings />} />'
);

fs.writeFileSync('src/App.tsx', code);
