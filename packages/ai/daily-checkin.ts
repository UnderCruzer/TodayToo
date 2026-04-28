import { GoogleGenAI, Type } from '@google/genai';
import type { Elder } from '@oneuldo/types';
import {
  getElderById,
  getElderContext,
  saveConversation,
  logConcern,
  getAllElders,
} from '@oneuldo/db/queries';
import { sendPushNotification, sendReplyToElder } from './notifications';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

const DAILY_PROMPTS = {
  ja: [
    'おはようございます{name}さん！今日の朝ごはんは食べましたか？😊',
    'こんにちは{name}さん！今日の天気はいかがですか？',
    '今日は何か楽しいことがありましたか？',
    '{name}さん、最近よく眠れていますか？',
    '今日のお昼ごはんは何を食べましたか？😋',
    '最近、誰かと会いましたか？どんなお話をしましたか？',
    '{name}さん、今日の体の調子はいかがですか？',
  ],
  ko: [
    '좋은 아침이에요 {name}님! 오늘 아침은 드셨어요? 😊',
    '안녕하세요 {name}님! 오늘 날씨 어때요?',
    '오늘 즐거운 일 있으셨어요?',
    '{name}님, 요즘 잘 주무시나요?',
    '오늘 점심은 뭐 드셨어요? 😋',
    '최근에 누구 만나셨어요? 어떤 이야기 나누셨나요?',
    '{name}님, 오늘 몸 상태는 어떠세요?',
  ],
};

function getRandomGreeting(language: 'ja' | 'ko', name: string): string {
  const prompts = DAILY_PROMPTS[language];
  const template = prompts[Math.floor(Math.random() * prompts.length)];
  return template.replace('{name}', name);
}

function getWarmGreeting(language: 'ja' | 'ko', name: string): string {
  return language === 'ja'
    ? `${name}さん、おはようございます。今日もそばにいますよ。どんなことでも聞かせてください。😊`
    : `${name}님, 좋은 아침이에요. 오늘도 곁에 있을게요. 무슨 이야기든 편하게 해주세요. 😊`;
}

export async function runDailyCheckin(elder: Elder): Promise<void> {
  const context = await getElderContext(elder.id);
  const hasConcern = context.lastConcernFlag?.level === 'medium';

  const greeting = hasConcern
    ? getWarmGreeting(elder.language as 'ja' | 'ko', elder.name)
    : getRandomGreeting(elder.language as 'ja' | 'ko', elder.name);

  await sendPushNotification(elder.pushToken, greeting);

  await saveConversation({
    elderId: elder.id,
    module: 'daily',
    question: greeting,
  });
}

export async function runAllDailyCheckins(): Promise<void> {
  const elders = await getAllElders();
  await Promise.allSettled(elders.map(runDailyCheckin));
}

function buildSystemInstruction(elder: Elder, recentTopics: string[]): string {
  const lang = elder.language as 'ja' | 'ko';
  return lang === 'ja'
    ? `あなたは${elder.name}さんの毎日の友達AIです。
温かく、ゆっくり、丁寧に話してください。
一度に質問は一つだけにしてください。
最近の会話のテーマ: ${JSON.stringify(recentTopics)}
返答は3文以内で。`
    : `당신은 ${elder.name}님의 매일 AI 친구입니다.
따뜻하고 천천히, 정중하게 대화해주세요.
한 번에 질문은 하나만 해주세요.
최근 대화 주제: ${JSON.stringify(recentTopics)}
답변은 3문장 이내로.`;
}

// 앱 음성 대화용 — AI 응답 텍스트를 반환 (앱에서 TTS로 읽어줌)
export async function processElderChat(
  elderId: string,
  message: string,
  imageUrl?: string
): Promise<string> {
  const elder = await getElderById(elderId);
  const context = await getElderContext(elderId);

  const systemInstruction = buildSystemInstruction(elder, context.recentTopics);

  const detectConcernDecl = {
    name: 'detect_concern',
    description: '우울/고립/건강 이상 신호 감지 시 호출',
    parameters: {
      type: Type.OBJECT,
      properties: {
        level: { type: Type.STRING, enum: ['low', 'medium', 'high'], description: '심각도 수준' },
        reason: { type: Type.STRING, description: '감지 이유' },
      },
      required: ['level', 'reason'],
    },
  };

  const saveMemoryDecl = {
    name: 'save_memory',
    description: '중요한 기억이나 감정을 DB에 저장',
    parameters: {
      type: Type.OBJECT,
      properties: {
        topic: { type: Type.STRING },
        emotion: { type: Type.STRING },
        content: { type: Type.STRING },
      },
      required: ['topic', 'content'],
    },
  };

  type Part = { text: string } | { inlineData: { mimeType: string; data: string } };
  let userParts: Part[];

  if (imageUrl) {
    const resp = await fetch(imageUrl);
    const buf = await resp.arrayBuffer();
    userParts = [
      { inlineData: { mimeType: resp.headers.get('content-type') ?? 'image/jpeg', data: Buffer.from(buf).toString('base64') } },
      { text: message || '(사진)' },
    ];
  } else {
    userParts = [{ text: message }];
  }

  const chat = ai.chats.create({
    model: 'gemini-2.5-flash',
    config: {
      systemInstruction,
      maxOutputTokens: 500,
      tools: [{ functionDeclarations: [detectConcernDecl, saveMemoryDecl] }],
    },
  });

  let response = await chat.sendMessage({ message: userParts });
  let aiText = '';

  while (true) {
    const fnCalls = response.functionCalls;

    if (!fnCalls || fnCalls.length === 0) {
      aiText = response.text ?? '';
      break;
    }

    const fc = fnCalls[0];
    const toolResult = await executeTool(fc.name!, fc.args as Record<string, string>, elder);
    response = await chat.sendMessage({
      message: [{ functionResponse: { name: fc.name!, response: { result: toolResult } } }],
    });
  }

  await saveConversation({ elderId, module: 'daily', question: message, answer: aiText });
  return aiText;
}

// 백그라운드 처리용 (cron 등에서 사용)
export async function processElderReply(elderId: string, message: string, imageUrl?: string): Promise<void> {
  const elder = await getElderById(elderId);
  const aiText = await processElderChat(elderId, message, imageUrl);
  await sendReplyToElder(elder, aiText);
}

async function executeTool(name: string, input: Record<string, string>, elder: Elder): Promise<string> {
  if (name === 'detect_concern') {
    await logConcern(elder.id, input.level as 'low' | 'medium' | 'high', input.reason);
    return JSON.stringify({ ok: true, level: input.level });
  }
  if (name === 'save_memory') {
    await saveConversation({
      elderId: elder.id,
      module: 'daily',
      question: input.topic,
      answer: input.content,
      emotionTags: input.emotion ? [input.emotion] : [],
    });
    return JSON.stringify({ ok: true });
  }
  return JSON.stringify({ error: 'unknown tool' });
}
