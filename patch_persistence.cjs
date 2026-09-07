const fs = require('fs');
let code = fs.readFileSync('src/firebase/config.ts', 'utf8');

if (!code.includes('persistentLocalCache')) {
  code = code.replace(
    "import { getFirestore } from 'firebase/firestore';",
    "import { getFirestore, initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from 'firebase/firestore';"
  );
  
  code = code.replace(
    'export const db = getFirestore(app, "ai-studio-eksuthautomatedb-11633c3c-efde-4345-bd5a-8516ed399d58");',
    `// Initialize Firestore with offline persistence
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() })
}, "ai-studio-eksuthautomatedb-11633c3c-efde-4345-bd5a-8516ed399d58");`
  );
  
  fs.writeFileSync('src/firebase/config.ts', code);
}
