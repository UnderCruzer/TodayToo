import { NextRequest, NextResponse } from 'next/server';
import { processElderChat } from '@oneuldo/ai';

// POST /api/elder/chat — 앱 음성 대화: STT 변환된 텍스트를 받아 AI 응답 텍스트 반환
// 앱이 응답 텍스트를 expo-speech로 TTS 재생함
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

    const aiText = await processElderChat(elderId, message, imageUrl);
    return NextResponse.json({ text: aiText });
  } catch (err) {
    console.error('[chat]', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
