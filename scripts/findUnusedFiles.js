// scripts/findUnusedFiles.js
const fs = require('fs');
const path = require('path');
const { glob } = require('glob'); // Updated import

const PROJECT_ROOT = path.join(__dirname, '..');
const IGNORE_DIRS = ['node_modules', 'logs', 'dist', '.git'];

async function getAllFiles() {
  try {
    const files = await glob('**/*.{js,ejs,css,json}', {
      cwd: PROJECT_ROOT,
      ignore: IGNORE_DIRS.map(dir => `${dir}/**`),
    });
    return files;
  } catch (err) {
    console.error('Error getting files:', err);
    return [];
  }
}

function findImports(content) {
  const imports = [];
  const requireMatches = content.match(/require\(['"](.*?)['"]\)/g) || [];
  requireMatches.forEach(match => {
    imports.push(match.match(/require\(['"](.*?)['"]\)/)[1]);
  });
  
  const importMatches = content.match(/import.*?from\s+['"](.*?)['"]/g) || [];
  importMatches.forEach(match => {
    imports.push(match.match(/from\s+['"](.*?)['"]/)[1]);
  });
  
  return imports;
}

async function findUnusedFiles() {
  const files = await getAllFiles();
  const usedFiles = new Set();
  
  for (const file of files) {
    try {
      const content = fs.readFileSync(path.join(PROJECT_ROOT, file), 'utf8');
      const imports = findImports(content);
      
      imports.forEach(imp => {
        const resolvedPath = path.resolve(path.dirname(path.join(PROJECT_ROOT, file)), imp);
        usedFiles.add(resolvedPath);
      });
    } catch (err) {
      console.error(`Error reading file ${file}:`, err);
    }
  }
  
  const unusedFiles = files.filter(file => !usedFiles.has(path.resolve(PROJECT_ROOT, file)));
  return unusedFiles;
}

findUnusedFiles()
  .then(unusedFiles => {
    console.log('Potentially unused files:');
    unusedFiles.forEach(file => console.log(file));
  })
  .catch(console.error);