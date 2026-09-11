import { Router, Request, Response } from 'express';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { config } from '../config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const appUpdateRouter = Router();

interface VersionManifestItem {
  versionName: string;
  versionCode: number;
  releaseDate: string;
  apkFileName: string;
  apkPath: string;
  releaseNotes?: string[];
  mandatory?: boolean;
}

interface VersionManifest {
  latest: VersionManifestItem;
  history: VersionManifestItem[];
}

function getManifest(): VersionManifest | null {
  const rootDir = path.resolve(__dirname, '..', '..', '..', '..');
  const serverDir = path.resolve(__dirname, '..', '..');
  const candidateManifests = [
    path.resolve(serverDir, 'public', 'releases', 'version-manifest.json'),
    path.resolve(rootDir, 'releases', 'version-manifest.json'),
    path.resolve(process.cwd(), 'releases', 'version-manifest.json'),
  ];

  for (const mPath of candidateManifests) {
    if (fs.existsSync(mPath)) {
      try {
        const raw = fs.readFileSync(mPath, 'utf-8');
        return JSON.parse(raw);
      } catch {
        // continue
      }
    }
  }
  return null;
}

// Candidate locations where FlowDesk APK might be stored
function getApkPath(version?: string): { path: string; filename: string } | null {
  const rootDir = path.resolve(__dirname, '..', '..', '..', '..');
  const serverDir = path.resolve(__dirname, '..', '..');

  if (version) {
    const cleanVer = version.replace(/^v/, '');
    const specificApkName = `FlowDesk-v${cleanVer}.apk`;
    const specificPaths = [
      path.resolve(serverDir, 'public', 'releases', specificApkName),
      path.resolve(rootDir, 'releases', specificApkName),
      path.resolve(process.cwd(), 'releases', specificApkName),
    ];
    for (const p of specificPaths) {
      if (fs.existsSync(p)) {
        return { path: p, filename: specificApkName };
      }
    }
  }

  // Fallback to latest / root FlowDesk.apk
  const defaultPaths = [
    path.resolve(rootDir, 'FlowDesk.apk'),
    path.resolve(serverDir, 'public', 'FlowDesk.apk'),
    path.resolve(rootDir, 'apps', 'web', 'android', 'app', 'build', 'outputs', 'apk', 'debug', 'app-debug.apk'),
    path.resolve(process.cwd(), 'FlowDesk.apk'),
  ];

  for (const p of defaultPaths) {
    if (fs.existsSync(p)) {
      return { path: p, filename: 'FlowDesk.apk' };
    }
  }
  return null;
}

/**
 * Check if a newer version of the mobile app is available.
 * FlowDesk mobile app connects to this endpoint on startup and can check both local server & GitHub.
 */
appUpdateRouter.get('/check', (req: Request, res: Response) => {
  const clientVersion = (req.query.version as string) || '1.0.0';
  const manifest = getManifest();

  const latestVersion = manifest?.latest.versionName || '1.0.1';
  const buildNumber = manifest?.latest.versionCode || 2;
  const releaseDate = manifest?.latest.releaseDate || '2026-09-11';
  const releaseNotes = manifest?.latest.releaseNotes || [
    'In-App automatic update prompt on opening the app',
    'One-tap native APK download & installer trigger',
    'Persistent historical version preservation system',
    'GitHub Releases & multi-source update availability check'
  ];
  const mandatory = manifest?.latest.mandatory || false;

  const latestApk = getApkPath(latestVersion) || getApkPath();
  let apkSize = 0;

  if (latestApk) {
    try {
      const stats = fs.statSync(latestApk.path);
      apkSize = stats.size;
    } catch {
      apkSize = 0;
    }
  }

  const isUpdateAvailable = compareVersions(latestVersion, clientVersion) > 0;

  res.json({
    latestVersion,
    buildNumber,
    clientVersion,
    updateAvailable: isUpdateAvailable,
    downloadUrl: `/api/v1/app-update/download?version=${latestVersion}`,
    apkAvailable: Boolean(latestApk),
    apkSize,
    apkFileName: latestApk ? latestApk.filename : `FlowDesk-v${latestVersion}.apk`,
    releaseDate,
    releaseNotes,
    mandatory,
    history: manifest?.history || []
  });
});

/**
 * List all preserved historical APK versions.
 */
appUpdateRouter.get('/versions', (_req: Request, res: Response) => {
  const manifest = getManifest();
  if (manifest) {
    return res.json(manifest);
  }
  res.json({
    latest: { versionName: '1.0.1', versionCode: 2, apkFileName: 'FlowDesk.apk' },
    history: []
  });
});

/**
 * Download a FlowDesk APK package. Supports ?version=1.0.0 for historical downloads.
 */
appUpdateRouter.get('/download', (req: Request, res: Response) => {
  const requestedVersion = req.query.version as string | undefined;
  const apkInfo = getApkPath(requestedVersion);

  if (!apkInfo || !fs.existsSync(apkInfo.path)) {
    return res.status(404).json({
      error: {
        code: 'APK_NOT_FOUND',
        message: requestedVersion
          ? `FlowDesk-v${requestedVersion}.apk not found in release archive.`
          : 'FlowDesk.apk is not compiled yet or not found on server.',
      },
    });
  }

  res.setHeader('Content-Type', 'application/vnd.android.package-archive');
  res.setHeader('Content-Disposition', `attachment; filename="${apkInfo.filename}"`);
  
  const fileStream = fs.createReadStream(apkInfo.path);
  fileStream.pipe(res);
});

function compareVersions(v1: string, v2: string): number {
  const parts1 = v1.replace(/^v/, '').split('.').map(n => parseInt(n, 10) || 0);
  const parts2 = v2.replace(/^v/, '').split('.').map(n => parseInt(n, 10) || 0);
  const maxLen = Math.max(parts1.length, parts2.length);

  for (let i = 0; i < maxLen; i++) {
    const num1 = parts1[i] || 0;
    const num2 = parts2[i] || 0;
    if (num1 > num2) return 1;
    if (num1 < num2) return -1;
  }
  return 0;
}
