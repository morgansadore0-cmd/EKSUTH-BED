const fs = require('fs');
let code = fs.readFileSync('src/components/Staff/CreateAccountModal.tsx', 'utf8');

if (!code.includes('getCollectionName } from')) {
  code = code.replace(/import\s*\{\s*([^}]*)\s*\}\s*from\s*['"]([^'"]*firebase\/config)['"];/g, "import { $1, getCollectionName } from '$2';");
  if (!code.includes('getCollectionName')) {
    code = `import { getCollectionName } from '../../firebase/config';\n` + code;
  }
}

fs.writeFileSync('src/components/Staff/CreateAccountModal.tsx', code);
