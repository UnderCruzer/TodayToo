import { NextRequest, NextResponse } from 'next/server';
import { runAllConcernChecks } from '@oneuldo/ai';

// GET /api/cron/concern-check — 매일 자정 (KST/JST)
// Cron: 0 15 * * *  (UTC 기준 — 한국/일본 자정)
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await runAllConcernChecks();
    return NextResponse.json({ ok: true, ts: new Date().toISOString() });
  } catch (err) {
    console.error('[cron/concern-check]', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
