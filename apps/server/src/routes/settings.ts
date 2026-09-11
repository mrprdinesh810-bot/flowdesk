import { Router } from 'express';
import { getDb } from '../db/db.js';
import { AiService } from '../services/aiService.js';
import { AiTestSchema } from '../domain/schemas.js';

export const settingsRouter = Router();

/**
 * GET /api/v1/settings
 */
settingsRouter.get('/', (req, res, next) => {
  try {
    const db = getDb();
    const rows = db.prepare<{ key: string; value_json: string }>('SELECT key, value_json FROM settings').all();
    const settingsMap: Record<string, any> = {};

    for (const r of rows) {
      try {
        settingsMap[r.key] = JSON.parse(r.value_json);
      } catch {
        settingsMap[r.key] = r.value_json;
      }
    }

    // Mask openrouter_api_key to prevent exposure (§45.J)
    const rawKey = settingsMap.openrouter_api_key || process.env.OPENROUTER_API_KEY;
    if (rawKey && typeof rawKey === 'string' && rawKey.length > 8) {
      settingsMap.has_openrouter_api_key = true;
      settingsMap.openrouter_api_key_masked = `${rawKey.slice(0, 10)}••••••••${rawKey.slice(-4)}`;
    } else {
      settingsMap.has_openrouter_api_key = false;
      settingsMap.openrouter_api_key_masked = '';
    }
    delete settingsMap.openrouter_api_key;

    res.json(settingsMap);
  } catch (err) {
    next(err);
  }
});

/**
 * PUT /api/v1/settings
 */
settingsRouter.put('/', (req, res, next) => {
  try {
    const db = getDb();
    const updates = req.body;
    if (typeof updates !== 'object' || updates === null) {
      return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Body must be a JSON object' } });
    }

    const now = new Date().toISOString();
    const upsertStmt = db.prepare(`
      INSERT INTO settings (key, value_json, updated_at)
      VALUES (?, ?, ?)
      ON CONFLICT(key) DO UPDATE SET value_json = excluded.value_json, updated_at = excluded.updated_at
    `);

    for (const [key, val] of Object.entries(updates)) {
      if (key === 'openrouter_api_key') {
        if (typeof val === 'string' && val.trim().length > 0 && !val.includes('•••')) {
          upsertStmt.run(key, JSON.stringify(val.trim()), now);
          process.env.OPENROUTER_API_KEY = val.trim();
        }
        continue;
      }
      upsertStmt.run(key, JSON.stringify(val), now);
    }

    res.json({ success: true, message: 'Settings saved.' });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/v1/settings/ai/test
 * Test connection to configured Ollama or OpenRouter provider per §66, §67
 */
settingsRouter.post('/ai/test', async (req, res, next) => {
  try {
    const input = AiTestSchema.parse(req.body);
    const db = getDb();

    if (input.provider === 'ollama') {
      const baseUrl = input.base_url || 'http://127.0.0.1:11434';
      let model = input.model;
      if (!model || model === 'llama3') {
        const storedModel = db.prepare('SELECT value_json FROM settings WHERE key = ?').get('ollama_model') as any;
        model = storedModel ? JSON.parse(storedModel.value_json) : 'mistral:latest';
      }
      const result = await AiService.testOllama(baseUrl, model || 'mistral:latest');
      return res.json(result);
    }

    if (input.provider === 'openrouter') {
      let key = input.api_key;
      if (!key || key.includes('•••')) {
        const storedKey = db.prepare('SELECT value_json FROM settings WHERE key = ?').get('openrouter_api_key') as any;
        if (storedKey) {
          try { key = JSON.parse(storedKey.value_json); } catch { key = storedKey.value_json; }
        } else {
          key = process.env.OPENROUTER_API_KEY;
        }
      }
      const model = input.model || 'minimax/minimax-m2.7:free';
      const result = await AiService.testOpenRouter(key, model);
      return res.json(result);
    }

    res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Unknown provider' } });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/settings/ai/models/ollama
 * Returns list of installed Ollama models from local instance
 */
settingsRouter.get('/ai/models/ollama', async (req, res) => {
  try {
    const db = getDb();
    const setting = db.prepare('SELECT value_json FROM settings WHERE key = ?').get('ollama_base_url') as any;
    const baseUrl = (setting ? JSON.parse(setting.value_json) : null) || 'http://127.0.0.1:11434';
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);
    const response = await fetch(`${baseUrl}/api/tags`, { signal: controller.signal });
    clearTimeout(timeout);
    if (!response.ok) return res.json({ models: [] });
    const data = await response.json() as { models?: Array<{ name: string }> };
    res.json({ models: (data.models || []).map(m => m.name) });
  } catch {
    res.json({ models: [] });
  }
});
