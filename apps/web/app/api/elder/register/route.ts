import { NextRequest, NextResponse } from 'next/server';
import { createElder } from '@oneuldo/db/queries';
import type { Language } from '@oneuldo/types';

export async function POST(req: NextRequest) {
  const { name, language } = await req.json() as { name: string; language: Language };
  if (!name) return NextResponse.json({ error: 'name required' }, { status: 400 });
  const elder = await createElder({ name, language: language ?? 'ja' });
  return NextResponse.json({ elderId: elder.id, name: elder.name });
}
