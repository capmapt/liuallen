CREATE TABLE IF NOT EXISTS my_daily_schedules (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  timezone TEXT NOT NULL,
  send_time TEXT NOT NULL,
  frequency TEXT NOT NULL,
  prompt TEXT NOT NULL,
  send_weekday INTEGER NOT NULL,
  created_at TEXT NOT NULL,
  last_sent_at TEXT,
  active INTEGER NOT NULL DEFAULT 1
);

CREATE INDEX IF NOT EXISTS my_daily_schedules_email ON my_daily_schedules(email);

CREATE TABLE IF NOT EXISTS my_daily_entries (
  id TEXT PRIMARY KEY,
  schedule_id TEXT,
  from_email TEXT,
  subject TEXT,
  body TEXT,
  received_at TEXT NOT NULL
);
