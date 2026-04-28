import { NextRequest, NextResponse } from 'next/server';

const MIGRATION_SQL = `
ALTER TABLE guardians
  ADD COLUMN IF NOT EXISTS line_user_id VARCHAR UNIQUE,
  ADD COLUMN IF NOT EXISTS kakao_user_id VARCHAR UNIQUE;

CREATE TABLE IF NOT EXISTS invite_tokens (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  elder_id    UUID REFERENCES elders(id) ON DELETE CASCADE,
  token       VARCHAR UNIQUE NOT NULL,
  used        BOOLEAN DEFAULT FALSE,
  expires_at  TIMESTAMP NOT NULL,
  created_at  TIMESTAMP DEFAULT NOW()
);
`.trim();

// POST /api/admin/migrate
// Header: Authorization: Bearer <SUPABASE_ACCESS_TOKEN>
// SUPABASE_ACCESS_TOKEN = Supabase Dashboard → Account → Access Tokens
export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization') ?? '';
  const token = authHeader.replace('Bearer ', '').trim()
    || (process.env.SUPABASE_ACCESS_TOKEN ?? '');

  if (!token) {
    return NextResponse.json({
      error: 'SUPABASE_ACCESS_TOKEN required',
      instructions: 'Supabase Dashboard → Account → Access Tokens에서 토큰 생성 후 .env에 SUPABASE_ACCESS_TOKEN 추가',
      sql: MIGRATION_SQL,
    }, { status: 400 });
  }

  const projectRef = (process.env.SUPABASE_URL ?? '').match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];
  if (!projectRef) {
    return NextResponse.json({ error: 'SUPABASE_URL not set' }, { status: 500 });
  }

  const res = await fetch(
    `https://api.supabase.com/v1/projects/${projectRef}/database/query`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ query: MIGRATION_SQL }),
    }
  );

  const result = await res.json();
  if (!res.ok) {
    return NextResponse.json({
      error: 'Migration failed',
      detail: result,
      sql: MIGRATION_SQL,
    }, { status: res.status });
  }

  return NextResponse.json({ ok: true, result });
}

// GET — SQL 반환 (Supabase SQL Editor에 직접 붙여넣기용)
export async function GET() {
  return NextResponse.json({
    message: 'POST 요청으로 마이그레이션 실행, 또는 아래 SQL을 Supabase SQL Editor에서 직접 실행',
    sql: MIGRATION_SQL,
  });
}
