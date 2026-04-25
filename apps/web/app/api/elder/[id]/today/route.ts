import { NextRequest, NextResponse } from 'next/server';
import { getRecentConversations } from '@oneuldo/db/queries';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const convs = await getRecentConversations(id, 5);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayMsg = convs.find(c => new Date(c.createdAt) >= today && !c.answer);
  return NextResponse.json({ message: todayMsg?.question ?? null });
}
