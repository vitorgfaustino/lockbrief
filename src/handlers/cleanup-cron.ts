/**
 * scheduled() — Cleanup periodico de segredos expirados.
 *
 * Executado a cada 30 minutos via Cron Trigger.
 * So remove segredos NAO consumidos e expirados.
 */

import type { Env } from "../router";
import { nowUnixSeconds } from "../lib/timestamps";

export async function handleCleanup(_event: ScheduledEvent, env: Env): Promise<void> {
  const now = nowUnixSeconds();

  try {
    const result = await env.DB.prepare(
      `DELETE FROM secrets
       WHERE expires_at <= ?1
         AND consumed_at IS NULL`
    )
      .bind(now)
      .run();

    const changed = result.meta.changed as number;
    if (changed > 0) {
      console.log(`cleanup: removed ${changed} expired secrets`);
    }
  } catch (err) {
    console.error("cleanup error:", String(err));
  }
}
