import { NextRequest, NextResponse } from 'next/server';
import { getRecentConversations } from '@oneuldo/db/queries';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const conversations = await getRecentConversations(id, 30);
  return NextResponse.json(conversations);
}
