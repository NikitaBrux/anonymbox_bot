import { pool } from './pool.js'

const schema = `
CREATE TABLE IF NOT EXISTS sessions (
  id          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  title       TEXT NOT NULL,
  created_by  TEXT NOT NULL,
  closes_at   TIMESTAMPTZ NOT NULL,
  is_active   BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS questions (
  id          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  session_id  TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  text        TEXT NOT NULL,
  votes_count INT NOT NULL DEFAULT 0,
  is_hidden   BOOLEAN NOT NULL DEFAULT false,
  is_answered BOOLEAN NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS votes (
  question_id       TEXT NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  voter_fingerprint TEXT NOT NULL,
  PRIMARY KEY (question_id, voter_fingerprint)
);

CREATE INDEX IF NOT EXISTS idx_questions_session ON questions(session_id);
CREATE INDEX IF NOT EXISTS idx_sessions_created_by ON sessions(created_by);
`

export async function migrate() {
  const client = await pool.connect()
  try {
    await client.query(schema)
    console.log('Migration complete')
  } finally {
    client.release()
  }
}
