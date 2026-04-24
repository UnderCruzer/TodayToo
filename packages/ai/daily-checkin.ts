import { GoogleGenerativeAI, FunctionDeclarationSchemaType } from '@google/generative-ai';
import type { Part } from '@google/generative-ai';
import type { Elder } from '@oneuldo/types';
import {
  getElderById,
  getElderContext,
  saveConversation,
  logConcern,
  getAllElders,
} from '@oneuldo/db/queries';
import {
  sendPushNotification,
  sendMessengerNotification,
  sendReplyToElder,
} from './notifications';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

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

  await Promise.allSettled([
    sendPushNotification(elder.pushToken, greeting),
    sendMessengerNotification(elder, greeting),
  ]);

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

export async function processElderReply(
  elderId: string,
  message: string,
  imageUrl?: string
): Promise<void> {
  const elder = await getElderById(elderId);
  const context = await getElderContext(elderId);

  const lang = elder.language as 'ja' | 'ko';
  const systemInstruction =
    lang === 'ja'
      ? `あなたは${elder.name}さんの毎日の友達AIです。
温かく、ゆっくり、丁寧に話してください。
一度に質問は一つだけにしてください。
最近の会話のテーマ: ${JSON.stringify(context.recentTopics)}
返答は3文以内で。`
      : `당신은 ${elder.name}님의 매일 AI 친구입니다.
따뜻하고 천천히, 정중하게 대화해주세요.
한 번에 질문은 하나만 해주세요.
최근 대화 주제: ${JSON.stringify(context.recentTopics)}
답변은 3문장 이내로.`;

  const model = genAI.getGenerativeModel({
    model: 'gemini-1.5-flash',
    systemInstruction,
    tools: [
      {
        functionDeclarations: [
          {
            name: 'detect_concern',
            description: '우울/고립/건강 이상 신호 감지 시 호출',
            parameters: {
              type: FunctionDeclarationSchemaType.OBJECT,
              properties: {
                level: {
                  type: FunctionDeclarationSchemaType.STRING,
                  enum: ['low', 'medium', 'high'],
                  description: '심각도 수준',
                },
                reason: {
                  type: FunctionDeclarationSchemaType.STRING,
                  description: '감지 이유',
                },
              },
              required: ['level', 'reason'],
            },
          },
          {
            name: 'save_memory',
            description: '중요한 기억이나 감정을 DB에 저장',
            parameters: {
              type: FunctionDeclarationSchemaType.OBJECT,
              properties: {
                topic: { type: FunctionDeclarationSchemaType.STRING },
                emotion: { type: FunctionDeclarationSchemaType.STRING },
                content: { type: FunctionDeclarationSchemaType.STRING },
              },
              required: ['topic', 'content'],
            },
          },
        ],
      },
    ],
    generationConfig: { maxOutputTokens: 500 },
  });

  const chat = model.startChat();

  let userParts: Part[];
  if (imageUrl) {
    const resp = await fetch(imageUrl);
    const buf = await resp.arrayBuffer();
    const base64 = Buffer.from(buf).toString('base64');
    const mimeType = resp.headers.get('content-type') ?? 'image/jpeg';
    userParts = [
      { inlineData: { mimeType, data: base64 } },
      { text: message || '(사진)' },
    ];
  } else {
    userParts = [{ text: message }];
  }

  let result = await chat.sendMessage(userParts);

  while (true) {
    const response = result.response;
    const functionCalls = response.functionCalls();

    if (!functionCalls || functionCalls.length === 0) {
      await sendReplyToElder(elder, response.text());
      await saveConversation({
        elderId,
        module: 'daily',
        question: message,
        answer: message,
      });
      break;
    }

    const fc = functionCalls[0];
    const toolResult = await executeTool(fc.name, fc.args as Record<string, string>, elder);

    result = await chat.sendMessage([
      {
        functionResponse: {
          name: fc.name,
          response: { result: toolResult },
        },
      },
    ]);
  }
}

async function executeTool(
  name: string,
  input: Record<string, string>,
  elder: Elder
): Promise<string> {
  if (name === 'detect_concern') {
    const level = input.level as 'low' | 'medium' | 'high';
    await logConcern(elder.id, level, input.reason);
    return JSON.stringify({ ok: true, level });
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
