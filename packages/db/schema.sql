-- 오늘도요 (今日もね) DB 스키마
-- PostgreSQL 15+ + pgvector 필요

CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "vector";

-- 어르신 프로필
CREATE TABLE IF NOT EXISTS elders (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            VARCHAR NOT NULL,
  language        VARCHAR NOT NULL DEFAULT 'ja',  -- 'ja' | 'ko'
  timezone        VARCHAR NOT NULL DEFAULT 'Asia/Tokyo',
  line_user_id    VARCHAR UNIQUE,   -- 일본 LINE 연동
  kakao_user_id   VARCHAR UNIQUE,   -- 한국 카카오 연동
  push_token      VARCHAR,          -- Expo 앱 푸시 토큰
  created_at      TIMESTAMP DEFAULT NOW()
);

-- 가족·기관 계정
CREATE TABLE IF NOT EXISTS guardians (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  elder_id    UUID REFERENCES elders(id) ON DELETE CASCADE,
  name        VARCHAR NOT NULL,
  role        VARCHAR NOT NULL DEFAULT 'family',  -- 'family' | 'welfare' | 'facility'
  email       VARCHAR UNIQUE NOT NULL,
  language    VARCHAR NOT NULL DEFAULT 'ja',
  created_at  TIMESTAMP DEFAULT NOW()
);

-- 대화 기록 (모듈 A daily + 모듈 C memoir 공유)
CREATE TABLE IF NOT EXISTS conversations (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  elder_id      UUID REFERENCES elders(id) ON DELETE CASCADE,
  module        VARCHAR NOT NULL,         -- 'daily' | 'memoir'
  question      TEXT NOT NULL,
  answer        TEXT,
  photo_urls    JSONB DEFAULT '[]',
  emotion_tags  JSONB DEFAULT '[]',       -- ['그리움', '자부심', '슬픔']
  embedding     VECTOR(1536),             -- text-embedding-3-small 호환
  week_number   INT,                      -- memoir 모듈용 주차
  created_at    TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS conversations_elder_id_idx ON conversations(elder_id);
CREATE INDEX IF NOT EXISTS conversations_module_idx ON conversations(module);
CREATE INDEX IF NOT EXISTS conversations_created_at_idx ON conversations(created_at);
-- pgvector HNSW 인덱스 (유사 대화 검색용)
CREATE INDEX IF NOT EXISTS conversations_embedding_idx
  ON conversations USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

-- 이상감지 로그 (모듈 B)
CREATE TABLE IF NOT EXISTS concern_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  elder_id    UUID REFERENCES elders(id) ON DELETE CASCADE,
  level       VARCHAR NOT NULL,  -- 'low' | 'medium' | 'high'
  reason      TEXT NOT NULL,
  notified    BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS concern_logs_elder_id_idx ON concern_logs(elder_id);
CREATE INDEX IF NOT EXISTS concern_logs_level_idx ON concern_logs(level);

-- 회고록 (모듈 C)
CREATE TABLE IF NOT EXISTS memoirs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  elder_id    UUID REFERENCES elders(id) ON DELETE CASCADE,
  month       VARCHAR NOT NULL,   -- 'YYYY-MM'
  chapters    JSONB NOT NULL,
  pdf_url     VARCHAR,
  sent_at     TIMESTAMP,
  created_at  TIMESTAMP DEFAULT NOW(),
  UNIQUE(elder_id, month)
);

CREATE INDEX IF NOT EXISTS memoirs_elder_id_idx ON memoirs(elder_id);

-- 가족 초대 토큰 (QR 코드용)
CREATE TABLE IF NOT EXISTS invite_tokens (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  elder_id    UUID REFERENCES elders(id) ON DELETE CASCADE,
  token       VARCHAR UNIQUE NOT NULL,
  used        BOOLEAN DEFAULT FALSE,
  expires_at  TIMESTAMP NOT NULL,
  created_at  TIMESTAMP DEFAULT NOW()
);
