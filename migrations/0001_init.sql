CREATE TABLE tasks (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  due TEXT,
  memo TEXT,
  done INTEGER NOT NULL DEFAULT 0,
  completed_date TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE settings (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  to_addr TEXT NOT NULL,
  subject TEXT NOT NULL,
  greeting TEXT,
  intro TEXT,
  closing TEXT,
  updated_at TEXT NOT NULL
);

INSERT INTO settings (id, to_addr, subject, greeting, intro, closing, updated_at)
VALUES (
  1,
  'test@sakaino.jp',
  'Claudeテスト',
  'お疲れ様です。',
  '本日完了したタスクは以下の通りです。',
  '以上、よろしくお願いいたします。',
  datetime('now')
);
