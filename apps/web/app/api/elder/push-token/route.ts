import { NextRequest, NextResponse } from 'next/server';
import { updateElderPushToken } from '@oneuldo/db/queries';

export async function POST(req: NextRequest) {
  const { elderId, pushToken } = await req.json() as { elderId: string; pushToken: string };
  if (!elderId || !pushToken) return NextResponse.json({ error: 'missing fields' }, { status: 400 });
  await updateElderPushToken(elderId, pushToken);
  return NextResponse.json({ ok: true });
}
