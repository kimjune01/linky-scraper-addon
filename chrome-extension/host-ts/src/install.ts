#!/usr/bin/env node
/**
 * Installation script for the native messaging host
 *
 * Registers the native messaging host with Chrome/Firefox by creating
 * the manifest file in the appropriate system location.
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';

const HOST_NAME = 'com.hoarder.hoard';
const HOST_DESCRIPTION = 'Hoarder native messaging host for content archival';

// Extension IDs - add your extension ID here
const CHROME_EXTENSION_IDS = [
  'chrome-extension://mpjincdljlmienomifoankgheoeoaodj/', // Production
];

const FIREFOX_EXTENSION_IDS: string[] = [
  // Add Firefox extension IDs here if needed
];

interface NativeManifest {
  name: string;
  description: string;
  path: string;
  type: 'stdio';
  allowed_origins?: string[];
  allowed_extensions?: string[];
}

/**
 * Gets the native messaging host manifest directory for the current platform
 */
function getManifestDir(browser: 'chrome' | 'firefox'): string {
  const platform = os.platform();
  const homeDir = os.homedir();

  if (platform === 'darwin') {
    // macOS
    if (browser === 'chrome') {
      return path.join(homeDir, 'Library/Application Support/Google/Chrome/NativeMessagingHosts');
    } else {
      return path.join(homeDir, 'Library/Application Support/Mozilla/NativeMessagingHosts');
    }
  } else if (platform === 'linux') {
    if (browser === 'chrome') {
      return path.join(homeDir, '.config/google-chrome/NativeMessagingHosts');
    } else {
      return path.join(homeDir, '.mozilla/native-messaging-hosts');
    }
  } else if (platform === 'win32') {
    // Windows uses registry, but we'll put the manifest in a standard location
    // The registry entry needs to point to this file
    if (browser === 'chrome') {
      return path.join(homeDir, 'AppData/Local/Google/Chrome/User Data/NativeMessagingHosts');
    } else {
      return path.join(homeDir, 'AppData/Roaming/Mozilla/NativeMessagingHosts');
    }
  }

  throw new Error(`Unsupported platform: ${platform}`);
}

/**
 * Gets the path to the native host executable
 */
function getHostPath(): string {
  // Get the directory where this script is located
  const scriptDir = path.dirname(new URL(import.meta.url).pathname);
  // Go up to dist, then reference the wrapper script or node command
  const hostDir = path.resolve(scriptDir, '..');

  const platform = os.platform();

  if (platform === 'win32') {
    // Windows: use a batch file wrapper
    return path.join(hostDir, 'native-host.bat');
  } else {
    // Unix: use a shell script wrapper
    return path.join(hostDir, 'native-host.sh');
  }
}

/**
 * Creates the wrapper script that invokes Node.js
 */
function createWrapperScript(): void {
  const scriptDir = path.dirname(new URL(import.meta.url).pathname);
  const hostDir = path.resolve(scriptDir, '..');
  const platform = os.platform();

  if (platform === 'win32') {
    // Windows batch file
    const batPath = path.join(hostDir, 'native-host.bat');
    const batContent = `@echo off
node "%~dp0dist\\index.js"
`;
    fs.writeFileSync(batPath, batContent);
    console.log(`Created wrapper script: ${batPath}`);
  } else {
    // Unix shell script
    const shPath = path.join(hostDir, 'native-host.sh');
    const shContent = `#!/bin/bash
DIR="$(cd "$(dirname "$0")" && pwd)"
exec node "$DIR/dist/index.js"
`;
    fs.writeFileSync(shPath, shContent, { mode: 0o755 });
    console.log(`Created wrapper script: ${shPath}`);
  }
}

/**
 * Creates the native messaging manifest
 */
function createManifest(browser: 'chrome' | 'firefox'): NativeManifest {
  const hostPath = getHostPath();

  const manifest: NativeManifest = {
    name: HOST_NAME,
    description: HOST_DESCRIPTION,
    path: hostPath,
    type: 'stdio',
  };

  if (browser === 'chrome') {
    manifest.allowed_origins = CHROME_EXTENSION_IDS;
  } else {
    manifest.allowed_extensions = FIREFOX_EXTENSION_IDS;
  }

  return manifest;
}

/**
 * Installs the native messaging host
 */
function install(browser: 'chrome' | 'firefox'): void {
  const manifestDir = getManifestDir(browser);
  const manifestPath = path.join(manifestDir, `${HOST_NAME}.json`);

  // Create directory if it doesn't exist
  fs.mkdirSync(manifestDir, { recursive: true });

  // Create wrapper script
  createWrapperScript();

  // Create and write manifest
  const manifest = createManifest(browser);
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

  console.log(`Installed native messaging host for ${browser}`);
  console.log(`Manifest location: ${manifestPath}`);
  console.log(`Host path: ${manifest.path}`);

  if (os.platform() === 'win32') {
    console.log('\nNote: On Windows, you may also need to add a registry entry.');
    console.log(`Key: HKCU\\Software\\Google\\Chrome\\NativeMessagingHosts\\${HOST_NAME}`);
    console.log(`Value: ${manifestPath}`);
  }
}

/**
 * Uninstalls the native messaging host
 */
function uninstall(browser: 'chrome' | 'firefox'): void {
  const manifestDir = getManifestDir(browser);
  const manifestPath = path.join(manifestDir, `${HOST_NAME}.json`);

  if (fs.existsSync(manifestPath)) {
    fs.unlinkSync(manifestPath);
    console.log(`Uninstalled native messaging host for ${browser}`);
    console.log(`Removed: ${manifestPath}`);
  } else {
    console.log(`No manifest found at ${manifestPath}`);
  }
}

/**
 * Main entry point
 */
function main(): void {
  const args = process.argv.slice(2);
  const isUninstall = args.includes('--uninstall');
  const browser = args.includes('--firefox') ? 'firefox' : 'chrome';

  console.log(`\nHoarder Native Messaging Host Installer\n`);

  if (isUninstall) {
    uninstall(browser);
  } else {
    install(browser);
  }
}

main();
