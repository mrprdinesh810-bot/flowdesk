import crypto from 'node:crypto';
import { DatabaseAdapter } from '../db/db.js';
import { Task, DailyReview } from '../domain/types.js';

export interface AnalyticsSummary {
  completion_rate: number; // 0 to 100
  completed_tasks: number;
  total_eligible_tasks: number;
  total_planned_minutes: number;
  total_actual_minutes: number;
  average_estimation_error_minutes: number;
  estimation_accuracy_percent: number;
  total_postponements: number;
  productive_hours: Array<{ hour: number; active_minutes: number }>;
}

export class AnalyticsService {
  /**
   * Calculate deterministic analytics summary per §61
   */
  static getAnalyticsSummary(db: DatabaseAdapter, days = 14): AnalyticsSummary {
    const tasks = db.prepare<Task>(`
      SELECT * FROM tasks
      WHERE status != 'cancelled'
      ORDER BY scheduled_date DESC
    `).all();

    const eligible = tasks.filter(t => t.status === 'completed' || t.status === 'missed' || t.status === 'postponed');
    const completed = tasks.filter(t => t.status === 'completed');

    const completionRate = eligible.length > 0
      ? Math.round((completed.length / eligible.length) * 100)
      : (tasks.length > 0 ? Math.round((completed.length / tasks.length) * 100) : 0);

    let totalPlannedMinutes = 0;
    let totalActualMinutes = 0;
    let totalAbsErrorMinutes = 0;

    for (const t of completed) {
      const plannedM = t.planned_duration || t.estimated_duration;
      const actualM = Math.round((t.actual_duration || 0) / 60);
      totalPlannedMinutes += plannedM;
      totalActualMinutes += actualM;
      totalAbsErrorMinutes += Math.abs(actualM - plannedM);
    }

    const avgError = completed.length > 0
      ? Math.round(totalAbsErrorMinutes / completed.length)
      : 0;

    const estimationAccuracy = totalPlannedMinutes > 0
      ? Math.max(0, Math.min(100, Math.round(100 - (totalAbsErrorMinutes / totalPlannedMinutes) * 100)))
      : 100;

    const totalPostponements = tasks.reduce((sum, t) => sum + (t.postponed_count || 0), 0);

    // Productive hours distribution from timer_sessions
    const sessions = db.prepare<{ started_at: string; active_seconds: number }>(`
      SELECT started_at, active_seconds FROM timer_sessions
      WHERE active_seconds > 0
    `).all();

    const hourBuckets: Record<number, number> = {};
    for (let h = 0; h < 24; h++) hourBuckets[h] = 0;

    for (const s of sessions) {
      if (s.started_at) {
        const hour = new Date(s.started_at).getHours();
        hourBuckets[hour] = (hourBuckets[hour] || 0) + Math.round(s.active_seconds / 60);
      }
    }

    const productiveHours = Object.entries(hourBuckets).map(([h, m]) => ({
      hour: Number(h),
      active_minutes: m,
    }));

    return {
      completion_rate: completionRate,
      completed_tasks: completed.length,
      total_eligible_tasks: eligible.length || tasks.length,
      total_planned_minutes: totalPlannedMinutes,
      total_actual_minutes: totalActualMinutes,
      average_estimation_error_minutes: avgError,
      estimation_accuracy_percent: estimationAccuracy,
      total_postponements: totalPostponements,
      productive_hours: productiveHours,
    };
  }

  /**
   * Evidence-based pattern detection & recommendation generation per §62, §63, §64
   */
  static refreshPatternsAndRecommendations(db: DatabaseAdapter): void {
    const tasks = db.prepare<Task>("SELECT * FROM tasks WHERE status = 'completed'").all();
    const now = new Date().toISOString();

    // 1. Check underestimation pattern for categories
    const categoryStats: Record<string, { count: number; totalPlanned: number; totalActual: number }> = {};

    for (const t of tasks) {
      const cat = t.category || 'General';
      if (!categoryStats[cat]) {
        categoryStats[cat] = { count: 0, totalPlanned: 0, totalActual: 0 };
      }
      categoryStats[cat].count += 1;
      categoryStats[cat].totalPlanned += t.planned_duration;
      categoryStats[cat].totalActual += Math.round(t.actual_duration / 60);
    }

    for (const [cat, stat] of Object.entries(categoryStats)) {
      if (stat.count >= 2) {
        const avgPlanned = Math.round(stat.totalPlanned / stat.count);
        const avgActual = Math.round(stat.totalActual / stat.count);
        const ratio = avgActual / Math.max(1, avgPlanned);

        if (ratio > 1.25) {
          const confidence = stat.count >= 6 ? 'strong' : (stat.count >= 4 ? 'supported' : 'emerging');
          const patId = `pat_under_${cat.toLowerCase()}`;

          db.prepare(`
            INSERT OR REPLACE INTO patterns (
              id, pattern_type, observation_window_start, observation_window_end,
              metric_value, sample_count, confidence, calculation_method,
              evidence_json, human_readable_summary, generated_at
            ) VALUES (?, 'duration_underestimation', ?, ?, ?, ?, ?, 'category_planned_vs_actual_ratio', ?, ?, ?)
          `).run(
            patId,
            tasks[0]?.created_at || now,
            now,
            ratio,
            stat.count,
            confidence,
            JSON.stringify({ category: cat, avgPlannedMinutes: avgPlanned, avgActualMinutes: avgActual }),
            `You tend to underestimate ${cat} tasks by ~${Math.round((ratio - 1) * 100)}% on average.`,
            now
          );

          // Generate recommendation if not already existing
          const existingRec = db.prepare('SELECT id FROM recommendations WHERE pattern_id = ? AND status = ?').get(patId, 'pending');
          if (!existingRec) {
            db.prepare(`
              INSERT INTO recommendations (
                id, pattern_id, recommendation_type, affected_category, message,
                confidence, evidence_json, status, created_at
              ) VALUES (?, ?, 'duration_adjustment', ?, ?, ?, ?, 'pending', ?)
            `).run(
              `rec_${crypto.randomUUID().slice(0, 8)}`,
              patId,
              cat,
              `Consider planning ~${Math.round(avgPlanned * 1.3)}m for ${cat} tasks instead of ${avgPlanned}m.`,
              confidence,
              JSON.stringify({ sample_count: stat.count, planned_average_minutes: avgPlanned, actual_average_minutes: avgActual }),
              now
            );
          }
        }
      }
    }
  }
}
