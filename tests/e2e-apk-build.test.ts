import path from 'node:path';
import fs from 'node:fs';
import AdmZip from 'adm-zip';
import { ProjectService } from '../apps/backend/src/services/projectService.js';
import { BuildEngine } from '../apps/backend/src/services/buildEngine.js';
import { EnvironmentService } from '../apps/backend/src/services/environmentService.js';

async function runEndToEndApkTest() {
  console.log('===============================================================');
  console.log('STARTING END-TO-END HTML TO ANDROID APK GENERATION VERIFICATION');
  console.log('===============================================================');

  // Step 1: Verify Environment
  console.log('\n[1/5] Checking Toolchain Environment...');
  const env = EnvironmentService.checkEnvironment(true);
  console.log(`Java: ${env.java.version} (JAVA_HOME: ${env.java.javaHome})`);
  console.log(`Android SDK: ${env.androidSdk.sdkPath}`);
  console.log(`Platforms: ${env.androidSdk.platforms.join(', ')}`);
  console.log(`Build Tools: ${env.androidSdk.buildTools.join(', ')}`);
  console.log(`Ready for build: ${env.isReady}`);

  if (!env.isReady) {
    throw new Error(`Environment is not ready: ${env.issues.join(', ')}`);
  }

  // Step 2: Create a Realistic Sample HTML/CSS/JS Web Project
  console.log('\n[2/5] Creating Sample Web Project (Interactive Calculator)...');
  const sampleDir = path.resolve('storage', 'temp', 'sample-web-calc');
  if (fs.existsSync(sampleDir)) fs.rmSync(sampleDir, { recursive: true, force: true });
  fs.mkdirSync(sampleDir, { recursive: true });

  const indexHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Modern Calculator</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <div class="calculator">
    <div id="display" class="display">0</div>
    <div class="keypad">
      <button onclick="clearDisplay()" class="action">C</button>
      <button onclick="appendOp('/')" class="op">÷</button>
      <button onclick="appendOp('*')" class="op">×</button>
      <button onclick="deleteLast()" class="action">⌫</button>
      <button onclick="appendNum('7')">7</button>
      <button onclick="appendNum('8')">8</button>
      <button onclick="appendNum('9')">9</button>
      <button onclick="appendOp('-')" class="op">−</button>
      <button onclick="appendNum('4')">4</button>
      <button onclick="appendNum('5')">5</button>
      <button onclick="appendNum('6')">6</button>
      <button onclick="appendOp('+')" class="op">+</button>
      <button onclick="appendNum('1')">1</button>
      <button onclick="appendNum('2')">2</button>
      <button onclick="appendNum('3')">3</button>
      <button onclick="calculate()" class="equals">=</button>
      <button onclick="appendNum('0')" class="zero">0</button>
      <button onclick="appendNum('.')">.</button>
    </div>
  </div>
  <script src="script.js"></script>
</body>
</html>`;

  const styleCss = `body {
  font-family: -apple-system, system-ui, sans-serif;
  margin: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: #090d16;
  color: #fff;
}
.calculator {
  background: #151d2a;
  padding: 24px;
  border-radius: 28px;
  box-shadow: 0 20px 40px rgba(0,0,0,0.6);
  width: 320px;
}
.display {
  font-size: 40px;
  text-align: right;
  padding: 20px 10px;
  margin-bottom: 20px;
  border-bottom: 1px solid #233144;
  overflow-x: auto;
}
.keypad {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}
button {
  height: 60px;
  border-radius: 16px;
  border: none;
  font-size: 20px;
  font-weight: 600;
  background: #233144;
  color: #f1f5f9;
  cursor: pointer;
}
button.op { background: #3b82f6; }
button.action { background: #475569; }
button.equals { background: #10b981; grid-row: span 2; height: 132px; }
button.zero { grid-column: span 2; }`;

  const scriptJs = `let displayVal = '0';
function update() { document.getElementById('display').innerText = displayVal; }
function appendNum(n) { displayVal = displayVal === '0' ? n : displayVal + n; update(); }
function appendOp(op) { displayVal += ' ' + op + ' '; update(); }
function clearDisplay() { displayVal = '0'; update(); }
function deleteLast() { displayVal = displayVal.slice(0, -1) || '0'; update(); }
function calculate() {
  try {
    displayVal = String(eval(displayVal.replace(/×/g, '*').replace(/÷/g, '/')));
  } catch(e) {
    displayVal = 'Error';
  }
  update();
}`;

  fs.writeFileSync(path.join(sampleDir, 'index.html'), indexHtml);
  fs.writeFileSync(path.join(sampleDir, 'style.css'), styleCss);
  fs.writeFileSync(path.join(sampleDir, 'script.js'), scriptJs);

  // Package into zip
  const zipPath = path.resolve('storage', 'temp', 'calculator-project.zip');
  const zip = new AdmZip();
  zip.addLocalFolder(sampleDir);
  zip.writeZip(zipPath);
  console.log(`Sample project archived to: ${zipPath}`);

  // Step 3: Create Project in Platform
  console.log('\n[3/5] Initializing Platform Project & Extracting Archive...');
  const project = ProjectService.createProject({
    name: 'Modern Calculator',
    packageName: 'com.calc.moderncalculator',
    versionName: '1.0.0',
    versionCode: 1,
    description: 'A sleek, offline-capable Android calculator converted from HTML/CSS/JS',
    orientation: 'portrait',
    permissions: {
      internet: true,
      camera: false,
      microphone: false,
      location: false,
      fineLocation: false,
      coarseLocation: false,
      fileAccess: true,
      notifications: false,
      vibration: true
    },
    webviewConfig: {
      enableJavaScript: true,
      enableDomStorage: true,
      enableLocalStorage: true,
      enableFileUpload: true,
      enableCameraAccess: false,
      enableMicrophoneAccess: false,
      enableGeolocation: false,
      enableZoom: false,
      enableFullscreen: false,
      enableDownloadSupport: true,
      enableExternalLinks: true,
      enableOfflineMode: true
    }
  });

  const extractInfo = ProjectService.extractZip(project.id, zipPath);
  console.log(`Extracted ${extractInfo.totalFiles} files. Default entry point: ${extractInfo.defaultEntryPoint}`);

  // Step 4: Run Real APK Generation Engine
  console.log('\n[4/5] Executing Real APK Generation Engine via Gradle...');
  const buildEngine = BuildEngine.getInstance();
  const buildRecord = await buildEngine.startBuild({
    projectId: project.id,
    buildType: 'debug'
  });

  console.log(`Build launched with ID: ${buildRecord.id}`);

  // Wait for build to finish
  const finalBuild = await new Promise<any>((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error('Build timed out after 5 minutes.'));
    }, 5 * 60 * 1000);

    const checkInterval = setInterval(() => {
      const b = BuildEngine.getBuild(buildRecord.id);
      if (b && (b.status === 'success' || b.status === 'failed')) {
        clearInterval(checkInterval);
        clearTimeout(timeout);
        resolve(b);
      }
    }, 2000);
  });

  console.log(`\nBuild ended with status: ${finalBuild.status}`);
  if (finalBuild.status !== 'success') {
    console.error(`Build failed with error: ${finalBuild.errorMessage}`);
    console.error(`Logs snippet:\n${finalBuild.logs.slice(-1000)}`);
    throw new Error(`Build failed: ${finalBuild.errorMessage}`);
  }

  // Step 5: Verify the APK Output
  console.log('\n[5/5] Inspecting Generated Android APK Artifact...');
  const apkPath = finalBuild.apkPath;
  console.log(`APK Output Path: ${apkPath}`);

  if (!apkPath || !fs.existsSync(apkPath)) {
    throw new Error(`Generated APK file not found on disk at: ${apkPath}`);
  }

  const stat = fs.statSync(apkPath);
  console.log(`APK File Size: ${(stat.size / (1024 * 1024)).toFixed(2)} MB (${stat.size} bytes)`);

  const apkZip = new AdmZip(apkPath);
  const apkEntries = apkZip.getEntries().map(e => e.entryName);

  const requiredEntries = [
    'AndroidManifest.xml',
    'classes.dex',
    'resources.arsc',
    'assets/www/index.html',
    'assets/www/style.css',
    'assets/www/script.js'
  ];

  for (const req of requiredEntries) {
    if (!apkEntries.includes(req)) {
      throw new Error(`Missing expected file inside generated APK: ${req}`);
    }
    console.log(`  ✓ Verified APK entry: ${req}`);
  }

  // Verify internal content of assets/www/index.html
  const bundledHtml = apkZip.readAsText('assets/www/index.html');
  if (!bundledHtml.includes('Modern Calculator')) {
    throw new Error('Bundled index.html content does not match original web project!');
  }
  console.log('  ✓ Verified web content integrity inside APK package.');

  console.log('\n===============================================================');
  console.log('SUCCESS: REAL ANDROID APK SUCCESSFULLY GENERATED & VERIFIED!');
  console.log(`Final APK Location: ${apkPath}`);
  console.log('===============================================================\n');

  // Clean test sample files
  fs.rmSync(sampleDir, { recursive: true, force: true });
  fs.unlinkSync(zipPath);
}

runEndToEndApkTest().catch((err) => {
  console.error('\nE2E TEST FAILURE:', err);
  process.exit(1);
});

