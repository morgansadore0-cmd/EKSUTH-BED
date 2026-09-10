const fs = require('fs');
let code = fs.readFileSync('src/firebase/config.ts', 'utf8');

code = code.replace(
`export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() })
}, "ai-studio-eksuthautomatedb-11633c3c-efde-4345-bd5a-8516ed399d58");`,
`let dbInstance;
try {
  dbInstance = initializeFirestore(app, {
    localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() })
  }, "ai-studio-eksuthautomatedb-11633c3c-efde-4345-bd5a-8516ed399d58");
} catch (e) {
  dbInstance = getFirestore(app, "ai-studio-eksuthautomatedb-11633c3c-efde-4345-bd5a-8516ed399d58");
}
export const db = dbInstance;`
);

fs.writeFileSync('src/firebase/config.ts', code);
