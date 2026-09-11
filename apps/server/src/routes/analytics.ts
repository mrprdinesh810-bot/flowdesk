import { Router } from 'express';
import { getDb } from '../db/db.js';
import { AnalyticsService } from '../services/analyticsService.js';

export const analyticsRouter = Router();

/**
 * GET /api/v1/analytics
 * Returns deterministic numerical metrics
 */
analyticsRouter.get('/', (req, res, next) => {
  try {
    const db = getDb();
    const summary = AnalyticsService.getAnalyticsSummary(db);
    res.json(summary);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/patterns
 * Returns evidence-backed learned patterns
 */
analyticsRouter.get('/patterns', (req, res, next) => {
  try {
    const db = getDb();
    AnalyticsService.refreshPatternsAndRecommendations(db);
    const patterns = db.prepare('SELECT * FROM patterns ORDER BY sample_count DESC').all();
    res.json(patterns);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/recommendations
 * Returns active pending recommendations
 */
analyticsRouter.get('/recommendations', (req, res, next) => {
  try {
    const db = getDb();
    AnalyticsService.refreshPatternsAndRecommendations(db);
    const recommendations = db.prepare('SELECT * FROM recommendations WHERE status = ? ORDER BY created_at DESC')
      .all('pending');
    res.json(recommendations);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/v1/recommendations/:id/accept
 */
analyticsRouter.post('/recommendations/:id/accept', (req, res, next) => {
  try {
    const db = getDb();
    const now = new Date().toISOString();
    db.prepare("UPDATE recommendations SET status = 'accepted', resolved_at = ? WHERE id = ?")
      .run(now, req.params.id);
    res.json({ success: true, message: 'Recommendation accepted.' });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/v1/recommendations/:id/dismiss
 */
analyticsRouter.post('/recommendations/:id/dismiss', (req, res, next) => {
  try {
    const db = getDb();
    const now = new Date().toISOString();
    db.prepare("UPDATE recommendations SET status = 'dismissed', resolved_at = ? WHERE id = ?")
      .run(now, req.params.id);
    res.json({ success: true, message: 'Recommendation dismissed.' });
  } catch (err) {
    next(err);
  }
});
