const fs = require('fs');
let code = fs.readFileSync('src/pages/Landing.tsx', 'utf8');

if (!code.includes('useNavigate')) {
  code = code.replace(
    "import { Link } from 'react-router-dom';",
    "import { Link, useNavigate } from 'react-router-dom';\nimport { useAuth } from '../contexts/AuthContext';\nimport { toast } from 'react-toastify';"
  );
}

// In the component:
code = code.replace(
  "export default function Landing() {",
  "export default function Landing() {\n  const navigate = useNavigate();\n  const { loginMock } = useAuth();\n\n  const handleDemoMode = () => {\n    localStorage.setItem('demo_mode', 'true');\n    loginMock('NURSE');\n    toast.info('Interactive Demo Sandbox Launched');\n    navigate('/dashboard');\n  };\n\n  const handleLiveMode = () => {\n    localStorage.removeItem('demo_mode');\n  };"
);

// Update links
code = code.replace(
  '<Link to="/login" className="text-sm font-medium text-gray-700 hover:text-emerald-700 px-3 py-2">',
  '<Link to="/login" onClick={handleLiveMode} className="text-sm font-medium text-gray-700 hover:text-emerald-700 px-3 py-2">'
);

code = code.replace(
  '<Link\n              to="/login"\n              className="inline-flex items-center justify-center rounded-md bg-emerald-700 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 transition-colors"\n            >\n              Access System\n            </Link>',
  '<button\n              onClick={handleDemoMode}\n              className="inline-flex items-center justify-center rounded-md bg-emerald-700 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 transition-colors"\n            >\n              Try Demo\n            </button>'
);

code = code.replace(
  '<Link\n                to="/login"\n                className="rounded-md bg-emerald-700 px-6 py-3 text-base font-semibold text-white shadow-sm hover:bg-emerald-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 transition-all flex items-center gap-2"\n              >\n                Staff Login <ArrowRight className="w-4 h-4" />\n              </Link>',
  '<Link\n                to="/login"\n                onClick={handleLiveMode}\n                className="rounded-md bg-emerald-700 px-6 py-3 text-base font-semibold text-white shadow-sm hover:bg-emerald-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 transition-all flex items-center gap-2"\n              >\n                Staff Login <ArrowRight className="w-4 h-4" />\n              </Link>\n              <button\n                onClick={handleDemoMode}\n                className="rounded-md bg-white px-6 py-3 text-base font-semibold text-emerald-700 shadow-sm border border-emerald-200 hover:bg-emerald-50 transition-all flex items-center gap-2"\n              >\n                Interactive Demo\n              </button>'
);

fs.writeFileSync('src/pages/Landing.tsx', code);
