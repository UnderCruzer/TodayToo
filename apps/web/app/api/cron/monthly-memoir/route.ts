import { NextRequest, NextResponse } from 'next/server';
import { getAllElders } from '@oneuldo/db/queries';
import { buildMonthlyMemoir } from '@oneuldo/ai';

// GET /api/cron/monthly-memoir — 매월 마지막 날 자정
// Cron: 0 15 L * *  (GCP Cloud Scheduler 형식)
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const elders = await getAllElders();
    const now = new Date();
    // 이번 달 YYYY-MM (회고록은 이번 달 것을 생성)
    const month = now.toISOString().slice(0, 7);

    const results = await Promise.allSettled(
      elders.map(elder => buildMonthlyMemoir(elder.id, month))
    );

    const succeeded = results.filter(r => r.status === 'fulfilled').length;
    const skipped = results.filter(
      r => r.status === 'fulfilled' && (r as PromiseFulfilledResult<null>).value === null
    ).length;

    return NextResponse.json({
      ok: true,
      month,
      total: elders.length,
      succeeded,
      skipped,
      ts: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[cron/monthly-memoir]', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
