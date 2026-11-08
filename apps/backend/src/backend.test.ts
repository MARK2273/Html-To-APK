import { test, describe } from 'node:test';
import assert from 'node:assert';
import path from 'node:path';
import fs from 'node:fs';
import AdmZip from 'adm-zip';
import { validatePackageName, isSafePath, sanitizeFilename } from './utils/security.js';
import { ProjectService } from './services/projectService.js';
import { ZipService } from './services/zipService.js';
import { ManifestGenerator } from './services/manifestGenerator.js';
import { EnvironmentService } from './services/environmentService.js';

describe('Security Utilities', () => {
  test('validatePackageName rejects invalid package names', () => {
    assert.strictEqual(validatePackageName('').valid, false);
    assert.strictEqual(validatePackageName('myapp').valid, false); // needs at least two segments
    assert.strictEqual(validatePackageName('123.com').valid, false); // cannot start with number
    assert.strictEqual(validatePackageName('com.class.app').valid, false); // 'class' is a Java keyword
    assert.strictEqual(validatePackageName('com.example.my-app').valid, false); // hyphens not allowed in package names
  });

  test('validatePackageName accepts valid package names', () => {
    assert.strictEqual(validatePackageName('com.example.myapp').valid, true);
    assert.strictEqual(validatePackageName('org.company.calculator_pro').valid, true);
    assert.strictEqual(validatePackageName('io.github.developer.app123').valid, true);
  });

  test('isSafePath detects directory traversal attempts (Zip Slip)', () => {
    const baseDir = path.resolve('test_base');
    assert.strictEqual(isSafePath(baseDir, 'index.html'), true);
    assert.strictEqual(isSafePath(baseDir, 'assets/logo.png'), true);
    assert.strictEqual(isSafePath(baseDir, '../evil.txt'), false);
    assert.strictEqual(isSafePath(baseDir, '../../windows/system32/cmd.exe'), false);
  });

  test('sanitizeFilename removes illegal characters', () => {
    assert.strictEqual(sanitizeFilename('../hello.png'), 'hello.png');
    assert.strictEqual(sanitizeFilename('foo/bar/baz.jpg'), 'baz.jpg');
  });
});

describe('Manifest Generator', () => {
  test('generates valid AndroidManifest with permissions', () => {
    const manifest = ManifestGenerator.generate({
      packageName: 'com.test.app',
      appName: 'Test Application',
      orientation: 'portrait',
      permissions: {
        internet: true,
        camera: true,
        microphone: false,
        location: true,
        fineLocation: true,
        coarseLocation: false,
        fileAccess: false,
        notifications: false,
        vibration: true
      }
    });

    assert.ok(manifest.includes('android.permission.INTERNET'));
    assert.ok(manifest.includes('android.permission.CAMERA'));
    assert.ok(manifest.includes('android.permission.ACCESS_FINE_LOCATION'));
    assert.ok(manifest.includes('android.permission.VIBRATE'));
    assert.ok(manifest.includes('android:screenOrientation="portrait"'));
    assert.ok(!manifest.includes('android.permission.RECORD_AUDIO'));
  });
});

describe('Project Service & Zip Handling', () => {
  test('creates, retrieves, and lists projects in SQLite', () => {
    const project = ProjectService.createProject({
      name: 'Calculator App',
      packageName: 'com.calc.sample',
      versionName: '1.0.0',
      description: 'A test calculator web app'
    });

    assert.ok(project.id);
    assert.strictEqual(project.name, 'Calculator App');
    assert.strictEqual(project.packageName, 'com.calc.sample');

    const fetched = ProjectService.getProject(project.id);
    assert.ok(fetched);
    assert.strictEqual(fetched.id, project.id);
    assert.strictEqual(fetched.packageName, 'com.calc.sample');

    const list = ProjectService.listProjects();
    assert.ok(list.some(p => p.id === project.id));

    // Cleanup
    ProjectService.deleteProject(project.id);
    assert.strictEqual(ProjectService.getProject(project.id), null);
  });

  test('extracts zip file and detects entry point', () => {
    const testZipDir = path.resolve('test_zip_temp');
    if (!fs.existsSync(testZipDir)) fs.mkdirSync(testZipDir, { recursive: true });

    const zipPath = path.join(testZipDir, 'sample.zip');
    const zip = new AdmZip();
    zip.addFile('index.html', Buffer.from('<!DOCTYPE html><html><body><h1>Hello</h1></body></html>'));
    zip.addFile('style.css', Buffer.from('body { background: #000; }'));
    zip.addFile('js/main.js', Buffer.from('console.log("Ready");'));
    zip.writeZip(zipPath);

    const extractDir = path.join(testZipDir, 'extracted');
    const info = ZipService.extractWebsiteZip(zipPath, extractDir);

    assert.strictEqual(info.defaultEntryPoint, 'index.html');
    assert.strictEqual(info.totalFiles, 3);
    assert.ok(fs.existsSync(path.join(extractDir, 'index.html')));
    assert.ok(fs.existsSync(path.join(extractDir, 'style.css')));
    assert.ok(fs.existsSync(path.join(extractDir, 'js', 'main.js')));

    // Cleanup
    fs.rmSync(testZipDir, { recursive: true, force: true });
  });
});

describe('Environment Check', () => {
  test('detects installed Java and Android SDK', () => {
    const env = EnvironmentService.checkEnvironment(true);
    assert.ok(env.os.platform);
    assert.strictEqual(typeof env.isReady, 'boolean');
    assert.ok(env.java.installed);
    assert.ok(env.androidSdk.installed);
  });
});

