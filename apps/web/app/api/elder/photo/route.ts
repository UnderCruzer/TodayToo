import { NextRequest, NextResponse } from 'next/server';
import { getElderById, saveConversation } from '@oneuldo/db/queries';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY ?? '');

// POST /api/elder/photo
// multipart: elderId, language, image (file)
export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const elderId = form.get('elderId') as string;
    const language = (form.get('language') as string) || 'ja';
    const imageFile = form.get('image') as File | null;

    if (!elderId || !imageFile) {
      return NextResponse.json({ error: 'elderId and image required' }, { status: 400 });
    }

    const elder = await getElderById(elderId);
    const imageBytes = await imageFile.arrayBuffer();
    const base64Image = Buffer.from(imageBytes).toString('base64');
    const mimeType = (imageFile.type || 'image/jpeg') as 'image/jpeg' | 'image/png' | 'image/webp';

    const model = genai.getGenerativeModel({ model: 'gemini-2.5-flash-preview-04-17' });

    const prompt = language === 'ja'
      ? `あなたは${elder.name}さんの優しいAI友人です。この写真を見て、思い出や気持ちを引き出すような温かい会話を1〜2文で始めてください。敬語で、シンプルに話しかけてください。`
      : `당신은 ${elder.name}님의 친근한 AI 친구입니다. 이 사진을 보고 추억이나 감정을 이끌어낼 수 있는 따뜻한 대화를 1~2문장으로 시작해주세요. 존댓말로, 간결하게 말을 걸어주세요.`;

    const result = await model.generateContent([
      prompt,
      { inlineData: { data: base64Image, mimeType } },
    ]);

    const text = result.response.text().trim();

    await saveConversation({
      elderId,
      module: 'daily',
      question: language === 'ja' ? '（写真）' : '（사진）',
      answer: text,
      emotionTags: ['추억', '사진'],
    });

    return NextResponse.json({ text });
  } catch (err) {
    console.error('[elder/photo]', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
