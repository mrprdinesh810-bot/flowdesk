import path from 'node:path';
import dotenv from 'dotenv';

dotenv.config();

import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const defaultDbPath = path.resolve(__dirname, '..', 'flowdesk.sqlite');

export const config = {
  port: parseInt(process.env.PORT || '4000', 10),
  host: process.env.HOST || '0.0.0.0', // bind to all interfaces for local LAN/mobile access
  corsOrigins: [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://localhost:5173',
    'http://127.0.0.1:5173',
  ],
  dbPath: process.env.DB_PATH || defaultDbPath,
  ollamaBaseUrl: process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434',
  openrouterApiKey: process.env.OPENROUTER_API_KEY || '',
  openrouterBaseUrl: process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1',
  appVersion: '1.0.0',
  schemaVersion: 1,
  backupFormatVersion: 1,
};
