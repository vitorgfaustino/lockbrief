/**
 * scheduled() — Cleanup periodico de segredos expirados.
 *
 * Executado a cada 30 minutos via Cron Trigger.
 * Remove segredos expirados e sobras consumidas de fallback.
 */

import type { Env } from "../router";
import { nowUnixSeconds } from "../lib/timestamps";

export async function handleCleanup(_event: ScheduledEvent, env: Env): Promise<void> {
  const now = nowUnixSeconds();

  try {
    const result = await env.DB.prepare(
      `DELETE FROM secrets
       WHERE expires_at <= ?1
          OR (consumed_at IS NOT NULL AND consumed_at <= ?2)`
    )
      .bind(now, now - 60)
      .run();

    const changed = result.meta.changed as number;
    if (changed > 0) {
      console.log(`cleanup: removed ${changed} expired secrets`);
    }
  } catch (err) {
    console.error("cleanup: db error");
  }
}
