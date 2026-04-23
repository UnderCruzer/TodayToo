import { NextRequest, NextResponse } from 'next/server';
import { processElderReply } from '@oneuldo/ai';

// POST /api/elder/reply — 어르신 앱에서 답장 수신
export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      elderId: string;
      message: string;
      imageUrl?: string;
    };

    const { elderId, message, imageUrl } = body;
    if (!elderId || !message) {
      return NextResponse.json({ error: 'elderId and message required' }, { status: 400 });
    }

    // 비동기로 처리 (앱에 즉시 200 반환)
    processElderReply(elderId, message, imageUrl).catch(err =>
      console.error('[reply] processElderReply failed:', err)
    );

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[reply]', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
