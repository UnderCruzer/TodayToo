#!/usr/bin/env node
// DB 마이그레이션: node packages/db/migrate.js
// DATABASE_URL 필요: Supabase Dashboard → Settings → Database → Connection string (URI)
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL이 .env에 없습니다.');
  console.error('   Supabase Dashboard → Settings → Database → Connection string (URI) 복사 후 .env에 추가');
  console.error('   DATABASE_URL=postgresql://postgres.[ref]:[password]@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres');
  console.error('\n--- 수동 실행용 SQL (Supabase SQL Editor에 붙여넣기) ---');
  const sql = fs.readFileSync(path.join(__dirname, 'migrate-v2.sql'), 'utf8');
  console.log(sql);
  process.exit(1);
}

async function migrate() {
  const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });
  try {
    // schema.sql 전체 실행 (CREATE IF NOT EXISTS이므로 안전)
    const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
    await pool.query(schema);
    console.log('✅ schema.sql 완료');

    // v2 마이그레이션 (ALTER TABLE)
    const v2 = fs.readFileSync(path.join(__dirname, 'migrate-v2.sql'), 'utf8');
    await pool.query(v2);
    console.log('✅ migrate-v2.sql 완료');

    console.log('🎉 마이그레이션 완료');
  } finally {
    await pool.end();
  }
}

migrate().catch(err => {
  console.error('❌ 마이그레이션 실패:', err.message);
  process.exit(1);
});
