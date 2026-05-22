CREATE TABLE IF NOT EXISTS secrets (
  id_hash          TEXT PRIMARY KEY,
  encrypted_payload TEXT NOT NULL,
  expires_at       INTEGER NOT NULL,
  created_at       INTEGER NOT NULL,
  consumed_at      INTEGER,
  consume_token    TEXT
);

CREATE INDEX IF NOT EXISTS idx_secrets_expires_at
  ON secrets (expires_at);
