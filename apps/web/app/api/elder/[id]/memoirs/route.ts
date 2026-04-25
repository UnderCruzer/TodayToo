import { NextRequest, NextResponse } from 'next/server';
import { getMemoirsByElder } from '@oneuldo/db/queries';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const memoirs = await getMemoirsByElder(id);
  return NextResponse.json(memoirs);
}
