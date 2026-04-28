import { NextRequest, NextResponse } from 'next/server';
import { createInviteToken } from '@oneuldo/db/queries';

// POST /api/elder/invite — 보호자 초대 코드 발급 (7일 유효)
export async function POST(req: NextRequest) {
  try {
    const { elderId } = await req.json() as { elderId: string };
    if (!elderId) return NextResponse.json({ error: 'elderId required' }, { status: 400 });

    const token = await createInviteToken(elderId);
    return NextResponse.json({ token });
  } catch (err) {
    console.error('[elder/invite]', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
