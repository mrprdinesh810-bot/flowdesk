import { Router } from 'express';
import path from 'node:path';
import fs from 'node:fs';
import multer from 'multer';
import { getDb } from '../db/db.js';
import { BackupService } from '../services/backupService.js';

export const backupRouter = Router();
const upload = multer({ limits: { fileSize: 50 * 1024 * 1024 } }); // 50 MB max

/**
 * GET /api/v1/backup/export
 * Downloads portable ZIP backup
 */
backupRouter.get('/export', async (req, res, next) => {
  try {
    const db = getDb();
    const tempZipName = `flowdesk-backup-${new Date().toISOString().replace(/[:.]/g, '-')}.zip`;
    const tempZipPath = path.resolve(process.cwd(), 'temp', tempZipName);

    const tempDir = path.dirname(tempZipPath);
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    const { zipPath, sha256 } = await BackupService.exportBackup(db, tempZipPath);

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${tempZipName}"`);
    res.setHeader('X-FlowDesk-SHA256', sha256);

    const stream = fs.createReadStream(zipPath);
    stream.pipe(res);

    stream.on('end', () => {
      fs.rmSync(zipPath, { force: true });
    });
    stream.on('error', (err) => {
      fs.rmSync(zipPath, { force: true });
      next(err);
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/v1/backup/import
 * Validates and restores portable ZIP backup
 */
backupRouter.post('/import', upload.single('backup_file'), async (req, res, next) => {
  try {
    if (!req.file || !req.file.buffer) {
      return res.status(400).json({ error: { code: 'BACKUP_INVALID', message: 'No backup ZIP file provided.' } });
    }

    const result = await BackupService.importBackup(req.file.buffer);
    res.json({
      success: true,
      message: 'Backup validated and successfully restored.',
      record_counts: result.recordCounts,
    });
  } catch (err) {
    next(err);
  }
});
