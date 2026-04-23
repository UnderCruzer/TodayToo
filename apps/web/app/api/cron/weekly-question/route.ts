import { NextRequest, NextResponse } from 'next/server';
import { getAllElders } from '@oneuldo/db/queries';
import { sendWeeklyMemoirQuestion } from '@oneuldo/ai';
import { sendReplyToElder } from '@oneuldo/ai/notifications';

// GET /api/cron/weekly-question — 매주 월요일 오전 9시 (JST)
// Cron: 0 0 * * 1
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const elders = await getAllElders();

    await Promise.allSettled(
      elders.map(async elder => {
        const question = await sendWeeklyMemoirQuestion(elder);
        await sendReplyToElder(elder, question);
      })
    );

    return NextResponse.json({
      ok: true,
      sent: elders.length,
      ts: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[cron/weekly-question]', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
