import { NextRequest, NextResponse } from 'next/server';
import { runAllDailyCheckins } from '@oneuldo/ai';

// GET /api/cron/daily-checkin — 매일 오전 9시 (JST = UTC 0:00)
// Cron: 0 0 * * *
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await runAllDailyCheckins();
    return NextResponse.json({ ok: true, ts: new Date().toISOString() });
  } catch (err) {
    console.error('[cron/daily-checkin]', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
