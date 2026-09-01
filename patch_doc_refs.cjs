const fs = require('fs');

function findFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const stat = fs.statSync(dir + '/' + file);
    if (stat.isDirectory()) {
      if (file !== 'node_modules') {
         findFiles(dir + '/' + file, fileList);
      }
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      fileList.push(dir + '/' + file);
    }
  }
  return fileList;
}

const files = findFiles('src');
for (const file of files) {
  let code = fs.readFileSync(file, 'utf8');
  let originalCode = code;

  // Replace doc(db, 'NAME', id) with doc(db, getCollectionName('NAME'), id)
  if (code.includes('doc(db, ')) {
    code = code.replace(/doc\(db,\s*['"]([^'"]+)['"]/g, "doc(db, getCollectionName('$1')");
    
    // Add import if missing
    if (!code.includes('getCollectionName')) {
      code = code.replace(/import\s*\{\s*([^}]*)\s*\}\s*from\s*['"]([^'"]*firebase\/config)['"];/g, "import { $1, getCollectionName } from '$2';");
      if (!code.includes('getCollectionName')) {
        const depth = file.split('/').length - 2;
        const relativePath = depth === 0 ? './firebase/config' : '../'.repeat(depth) + 'firebase/config';
        code = `import { getCollectionName } from '${relativePath}';\n` + code;
      }
    }

    if (code !== originalCode) {
      fs.writeFileSync(file, code);
      console.log('Patched', file);
    }
  }
}
