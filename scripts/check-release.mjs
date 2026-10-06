import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

export const PROJECT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const APP_ROOT = PROJECT_ROOT;

const fail = (errors, message) => errors.push(message);

const excludedDirectories = new Set(['.git', 'app', 'dist', 'gradle', 'node_modules', 'scripts', 'tests']);

function listFiles(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    if (excludedDirectories.has(entry.name) || entry.name === '.DS_Store' || entry.name === 'Thumbs.db') return [];
    const fullPath = path.join(directory, entry.name);
    return entry.isDirectory() ? listFiles(fullPath) : [fullPath];
  });
}

function checkJson(filePath, errors) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (error) {
    fail(errors, `${path.relative(APP_ROOT, filePath)}: invalid JSON (${error.message})`);
    return null;
  }
}

export function auditRelease() {
  const errors = [];
  const warnings = [];
  if (!fs.existsSync(APP_ROOT)) {
    return { errors: [`Release source not found: ${APP_ROOT}`], warnings, filesChecked: 0 };
  }

  const allFiles = listFiles(APP_ROOT);
  const relativeFiles = new Set(allFiles.map((file) => path.relative(APP_ROOT, file).split(path.sep).join('/')));
  const htmlPath = path.join(APP_ROOT, 'index.html');
  if (!relativeFiles.has('index.html')) fail(errors, 'Missing index.html');

  const html = fs.existsSync(htmlPath) ? fs.readFileSync(htmlPath, 'utf8') : '';
  const htmlAssets = [...html.matchAll(/(?:src|href)="([^"]+)"/g)]
    .map((match) => match[1])
    .filter((asset) => !/^(?:https?:|data:|#|\/\/)/.test(asset));
  for (const asset of htmlAssets) {
    const cleanAsset = asset.split(/[?#]/)[0];
    if (cleanAsset && !relativeFiles.has(cleanAsset)) fail(errors, `index.html points to missing file: ${cleanAsset}`);
  }

  for (const file of allFiles.filter((item) => item.endsWith('.json'))) checkJson(file, errors);
  const manifest = checkJson(path.join(APP_ROOT, 'manifest.json'), errors);
  if (manifest) {
    if (!manifest.start_url || !manifest.display) fail(errors, 'manifest.json must define start_url and display');
    for (const icon of manifest.icons || []) {
      if (!relativeFiles.has(icon.src)) fail(errors, `PWA manifest icon is missing: ${icon.src}`);
    }
  }
  const twaManifest = checkJson(path.join(APP_ROOT, 'twa-manifest.json'), errors);
  if (twaManifest) {
    for (const key of ['iconUrl', 'maskableIconUrl']) {
      if (!twaManifest[key]) continue;
      try {
        const iconUrl = new URL(twaManifest[key]);
        const appPath = `/${path.basename(APP_ROOT)}/`;
        if (iconUrl.pathname.startsWith(appPath) && !relativeFiles.has(iconUrl.pathname.slice(appPath.length))) {
          fail(errors, `TWA ${key} points to missing file: ${iconUrl.pathname}`);
        }
      } catch {
        fail(errors, `TWA ${key} must be an absolute URL`);
      }
    }
    if (!Array.isArray(twaManifest.fingerprints) || twaManifest.fingerprints.length === 0) {
      warnings.push('Android TWA has no Digital Asset Links signing fingerprint.');
    }
    if (twaManifest.signingKey?.path && path.isAbsolute(twaManifest.signingKey.path)) {
      warnings.push('Android TWA manifest contains a machine-specific absolute signing-key path.');
    }
  }
  if (!fs.existsSync(path.join(APP_ROOT, 'android.keystore'))) {
    warnings.push('No Android release keystore is present; signed APK/AAB output needs an externally held key.');
  }
  const androidBuildPath = path.join(APP_ROOT, 'app', 'build.gradle');
  if (fs.existsSync(androidBuildPath)) {
    const androidBuild = fs.readFileSync(androidBuildPath, 'utf8');
    const targetApi = Number(androidBuild.match(/targetSdkVersion\s+(\d+)/)?.[1] || 0);
    if (targetApi < 36) fail(errors, `Google Play submission currently requires targetSdkVersion 36 or higher; project has ${targetApi || 'no value'}.`);
  }

  const jsFiles = allFiles.filter((file) => file.endsWith('.js'));
  for (const file of jsFiles) {
    const source = fs.readFileSync(file, 'utf8');
    const syntaxCheck = spawnSync(process.execPath, ['--input-type=module', '--check'], {
      input: source,
      encoding: 'utf8',
    });
    if (syntaxCheck.status !== 0) {
      fail(errors, `${path.relative(APP_ROOT, file)}: JavaScript syntax error\n${syntaxCheck.stderr.trim()}`);
    }

    const imports = source.matchAll(/\b(?:import|export)\s+(?:[^'";]*?\s+from\s*)?['"]([^'"]+)['"]|\bimport\(['"]([^'"]+)['"]\)/g);
    for (const match of imports) {
      const specifier = match[1] || match[2];
      if (!specifier.startsWith('.')) continue;
      const target = path.resolve(path.dirname(file), specifier);
      if (!fs.existsSync(target) || !fs.statSync(target).isFile()) {
        fail(errors, `${path.relative(APP_ROOT, file)} imports missing file: ${specifier}`);
      }
    }
  }

  const levelSystemPath = path.join(APP_ROOT, 'src', 'core', 'LevelSystem.js');
  if (fs.existsSync(levelSystemPath)) {
    const source = fs.readFileSync(levelSystemPath, 'utf8');
    const levelModes = [...source.matchAll(/^  (catch|bricks|puzzle|match3):/gm)].map((match) => match[1]);
    if (levelModes.length !== 4) fail(errors, `Expected 4 configured level modes, found ${levelModes.length}`);
  }

  const audioManagerPath = path.join(APP_ROOT, 'src', 'game', 'AudioManager.js');
  const audioDirectory = path.join(APP_ROOT, 'src', 'assets', 'audio');
  const proceduralMusicPath = path.join(APP_ROOT, 'src', 'game', 'ArcadeMusic.js');
  if (fs.existsSync(audioManagerPath) && !fs.existsSync(proceduralMusicPath) && (!fs.existsSync(audioDirectory) || !listFiles(audioDirectory).some((file) => /\.(mp3|ogg|wav|m4a|webm)$/i.test(file)))) {
    warnings.push('Background music is unavailable: no soundtrack files or procedural music module were found.');
  }
  warnings.push('No production rewarded-ad SDK is attached; ad-based rewards stay disabled.');
  warnings.push('In-app purchases stay disabled until a real store billing provider is connected.');

  const serviceWorkerPath = path.join(APP_ROOT, 'service-worker.js');
  if (fs.existsSync(serviceWorkerPath)) {
    const serviceWorker = fs.readFileSync(serviceWorkerPath, 'utf8');
    const precacheBlock = serviceWorker.match(/const STATIC_ASSETS = \[([\s\S]*?)\]/)?.[1] || '';
    const precacheEntries = [...precacheBlock.matchAll(/^\s*['"]([^'"]*)['"]\s*,?\s*$/gm)].map((match) => match[1]);
    for (const asset of precacheEntries.filter(Boolean)) {
      if (!relativeFiles.has(asset)) fail(errors, `Service Worker precache references missing file: ${asset}`);
    }
    const precache = new Set(precacheEntries);
    const required = new Set(htmlAssets.map((asset) => asset.split(/[?#]/)[0]));
    const moduleQueue = ['src/main.js'];
    while (moduleQueue.length) {
      const modulePath = moduleQueue.pop();
      if (required.has(modulePath)) continue;
      required.add(modulePath);
      const moduleFile = path.join(APP_ROOT, modulePath);
      if (!fs.existsSync(moduleFile)) continue;
      const source = fs.readFileSync(moduleFile, 'utf8');
      for (const match of source.matchAll(/\b(?:import|export)\s+(?:[^'";]*?\s+from\s*)?['"]([^'"]+)['"]|\bimport\(['"]([^'"]+)['"]\)/g)) {
        const specifier = match[1] || match[2];
        if (!specifier.startsWith('.')) continue;
        const child = path.posix.normalize(path.posix.join(path.posix.dirname(modulePath), specifier));
        if (!required.has(child)) moduleQueue.push(child);
      }
    }
    for (const asset of required) {
      if (!precache.has(asset)) fail(errors, `Offline shell omits required app file: ${asset}`);
    }
  }

  return { errors, warnings, filesChecked: allFiles.length, jsFilesChecked: jsFiles.length };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const report = auditRelease();
  console.log(`Release audit: ${report.filesChecked} files, ${report.jsFilesChecked} JavaScript files checked.`);
  for (const warning of report.warnings) console.warn(`WARN: ${warning}`);
  for (const error of report.errors) console.error(`ERROR: ${error}`);
  if (report.errors.length) process.exitCode = 1;
  else console.log('Release source checks passed.');
}
