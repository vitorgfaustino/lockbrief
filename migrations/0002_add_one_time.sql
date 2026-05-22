-- Adiciona coluna one_time para controlar se o segredo e destruido apos a primeira leitura.
-- 1 = leitura unica (destroi apos fetch), 0 = permanece ate expiracao (cron cleanup).
ALTER TABLE secrets ADD COLUMN one_time INTEGER NOT NULL DEFAULT 1;
