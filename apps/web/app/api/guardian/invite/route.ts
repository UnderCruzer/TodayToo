import { NextRequest, NextResponse } from 'next/server';
import { createInviteToken, consumeInviteToken, createGuardian } from '@oneuldo/db/queries';

// POST /api/guardian/invite — 어르신 QR 초대 토큰 생성
export async function POST(req: NextRequest) {
  try {
    const { elderId } = await req.json() as { elderId: string };
    if (!elderId) {
      return NextResponse.json({ error: 'elderId required' }, { status: 400 });
    }

    const token = await createInviteToken(elderId);
    const inviteUrl = `${process.env.BASE_URL}/join/${token}`;

    return NextResponse.json({ token, inviteUrl });
  } catch (err) {
    console.error('[guardian/invite POST]', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// PUT /api/guardian/invite — 초대 토큰 사용 + 보호자 등록
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json() as {
      token: string;
      name: string;
      email: string;
      role?: string;
      language?: string;
      lineUserId?: string;
      kakaoUserId?: string;
    };

    const { token, name, email, role = 'family', language = 'ja', lineUserId, kakaoUserId } = body;
    if (!token || !name || !email) {
      return NextResponse.json(
        { error: 'token, name, email required' },
        { status: 400 }
      );
    }

    const result = await consumeInviteToken(token);
    if (!result) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 400 });
    }

    const guardian = await createGuardian({
      elderId: result.elderId,
      name,
      email,
      role,
      language: language as 'ja' | 'ko',
      lineUserId,
      kakaoUserId,
    });

    return NextResponse.json({ guardian });
  } catch (err) {
    console.error('[guardian/invite PUT]', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
