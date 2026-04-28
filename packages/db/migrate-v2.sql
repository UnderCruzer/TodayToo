-- v2 마이그레이션: guardians 테이블에 LINE/카카오 컬럼 추가
-- Supabase Dashboard → SQL Editor에서 실행하거나 /api/admin/migrate 호출

ALTER TABLE guardians
  ADD COLUMN IF NOT EXISTS line_user_id VARCHAR UNIQUE,
  ADD COLUMN IF NOT EXISTS kakao_user_id VARCHAR UNIQUE;

-- invite_tokens 테이블이 없으면 생성
CREATE TABLE IF NOT EXISTS invite_tokens (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  elder_id    UUID REFERENCES elders(id) ON DELETE CASCADE,
  token       VARCHAR UNIQUE NOT NULL,
  used        BOOLEAN DEFAULT FALSE,
  expires_at  TIMESTAMP NOT NULL,
  created_at  TIMESTAMP DEFAULT NOW()
);
