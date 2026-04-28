import { NextRequest, NextResponse } from 'next/server';
import { processElderChat } from '@oneuldo/ai';

// POST /api/elder/voice — 오디오 파일 수신 → Whisper STT → AI 응답 텍스트 반환
// 앱이 응답 텍스트를 expo-speech로 TTS 재생
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const elderId = formData.get('elderId') as string;
    const language = (formData.get('language') as string) ?? 'ja';
    const audioFile = formData.get('audio') as File | null;

    if (!elderId || !audioFile) {
      return NextResponse.json({ error: 'elderId and audio required' }, { status: 400 });
    }

    // Whisper STT
    const whisperForm = new FormData();
    whisperForm.append('file', audioFile, 'voice.m4a');
    whisperForm.append('model', 'whisper-1');
    whisperForm.append('language', language === 'ja' ? 'ja' : 'ko');

    const whisperRes = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
      body: whisperForm,
    });

    if (!whisperRes.ok) {
      console.error('[voice] Whisper failed:', await whisperRes.text());
      return NextResponse.json({ error: 'STT failed' }, { status: 502 });
    }

    const { text: transcription } = await whisperRes.json() as { text: string };
    if (!transcription.trim()) {
      return NextResponse.json({ text: language === 'ja' ? 'もう一度話しかけてください😊' : '다시 말씀해 주세요 😊' });
    }

    const aiText = await processElderChat(elderId, transcription);
    return NextResponse.json({ text: aiText, transcription });
  } catch (err) {
    console.error('[voice]', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
