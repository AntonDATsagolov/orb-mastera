import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { APP_ROOT, PROJECT_ROOT, auditRelease } from './check-release.mjs';

const output = path.join(PROJECT_ROOT, 'dist');
const report = auditRelease();
if (report.errors.length) {
  for (const error of report.errors) console.error(`ERROR: ${error}`);
  process.exit(1);
}

const excludedDirectories = new Set(['.git', 'app', 'dist', 'gradle', 'node_modules', 'scripts', 'tests']);
const excludedFiles = new Set([
  '.DS_Store', 'Thumbs.db', 'build.gradle', 'gradle.properties', 'gradlew', 'gradlew.bat',
  'settings.gradle', 'twa-manifest.json', '.gitignore', 'README.md', 'package.json',
]);

fs.rmSync(output, { recursive: true, force: true });
fs.mkdirSync(output, { recursive: true });

function copyReleaseTree(source, destination) {
  for (const entry of fs.readdirSync(source, { withFileTypes: true })) {
    if (excludedDirectories.has(entry.name) || excludedFiles.has(entry.name)) continue;
    const from = path.join(source, entry.name);
    const to = path.join(destination, entry.name);
    if (entry.isDirectory()) {
      fs.mkdirSync(to, { recursive: true });
      copyReleaseTree(from, to);
    } else {
      fs.copyFileSync(from, to);
    }
  }
}

copyReleaseTree(APP_ROOT, output);
fs.writeFileSync(path.join(output, '.nojekyll'), '');
console.log(`Built static PWA: ${path.relative(PROJECT_ROOT, output)} (${report.filesChecked} source files audited).`);
for (const warning of report.warnings) console.warn(`WARN: ${warning}`);

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) process.exitCode = 0;
