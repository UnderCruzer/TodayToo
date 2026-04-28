import { NextRequest, NextResponse } from 'next/server';
import { getGuardians, getElderById } from '@oneuldo/db/queries';
import { sendGuardianNotification } from '@oneuldo/ai/notifications';

// POST /api/test/notify
// Body: { elderId: string, message?: string }
// 개발/테스트용: 보호자에게 알림 직접 발송
export async function POST(req: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 403 });
  }

  try {
    const { elderId, message = '테스트 알림입니다. / テスト通知です。' } =
      await req.json() as { elderId: string; message?: string };

    if (!elderId) {
      return NextResponse.json({ error: 'elderId required' }, { status: 400 });
    }

    const [elder, guardians] = await Promise.all([
      getElderById(elderId),
      getGuardians(elderId),
    ]);

    if (guardians.length === 0) {
      return NextResponse.json({ error: 'No guardians found for this elder' }, { status: 404 });
    }

    const results = await Promise.allSettled(
      guardians.map(g => sendGuardianNotification(g, `[테스트] ${message}`))
    );

    return NextResponse.json({
      elder: elder.name,
      guardians: guardians.map((g, i) => ({
        name: g.name,
        lineUserId: g.lineUserId ?? null,
        kakaoUserId: g.kakaoUserId ?? null,
        sent: results[i].status === 'fulfilled',
      })),
    });
  } catch (err) {
    console.error('[test/notify]', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
