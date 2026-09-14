const fs = require('fs');
const { execFileSync } = require('child_process');
const root = process.cwd();
const manifest = JSON.parse(fs.readFileSync('version.json', 'utf8'));
const html = fs.readFileSync('index.html', 'utf8');
const ui = html.match(/const APP_VERSION='([^']+)'/);
const gradle = fs.readFileSync('android/app/build.gradle', 'utf8');
const android = gradle.match(/versionName\s+"([^"]+)"/);
if (!ui || !android) throw new Error('APP_VERSION or versionName not found');
const values = [manifest.version, ui[1], android[1]];
if (new Set(values).size !== 1) throw new Error(`Version mismatch: ${values.join(' / ')}`);
const apk = process.argv[2];
if (apk) {
  const out = execFileSync('unzip', ['-p', apk, 'assets/public/version.json'], { encoding: 'utf8' });
  const embedded = JSON.parse(out);
  if (embedded.version !== manifest.version) throw new Error(`APK embedded version mismatch: ${embedded.version} / ${manifest.version}`);
  if (!manifest.apkUrl.endsWith(apk.split('/').pop())) throw new Error('version.json apkUrl does not point to supplied APK');
}
console.log(`Release verified: ${manifest.version}`);
