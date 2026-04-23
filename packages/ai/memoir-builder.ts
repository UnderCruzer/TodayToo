import Anthropic from '@anthropic-ai/sdk';
import type { Elder, MemoirChapter } from '@oneuldo/types';
import {
  getElderById,
  getElderContext,
  getMonthlyConversations,
  saveMemoir,
  markMemoirSent,
  getGuardians,
} from '@oneuldo/db/queries';
import { i18n } from '@oneuldo/types/i18n';
import { sendGuardianNotification } from './notifications';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// 매주 월요일: 회고록 특별 질문 발송
export async function sendWeeklyMemoirQuestion(elder: Elder): Promise<string> {
  const context = await getElderContext(elder.id);
  const recentTopics = context.recentTopics;

  const questionPrompt =
    elder.language === 'ja'
      ? `${elder.name}さんの最近の会話から、最も印象的なテーマは: ${recentTopics.join(', ') || '日常の出来事'}
         これに関連した、人生の大切な思い出を引き出す質問を1つ作ってください。
         優しく、懐かしさを感じるような言葉で。質問だけ出力してください。`
      : `${elder.name}님의 최근 대화 주요 주제: ${recentTopics.join(', ') || '일상'}
         이와 연결된 소중한 기억을 끌어낼 질문 1개를 만들어주세요.
         따뜻하고 그리운 감성으로. 질문만 출력해주세요.`;

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 200,
    // 시스템 프롬프트 캐싱 (반복 호출 비용 절감)
    system: [
      {
        type: 'text',
        text: elder.language === 'ja'
          ? 'あなたは高齢者の人生の物語を引き出す専門家です。温かく、懐かしさを大切にしてください。'
          : '당신은 어르신의 삶의 이야기를 이끌어내는 전문가입니다. 따뜻하고 그리운 감성을 소중히 여겨주세요.',
        cache_control: { type: 'ephemeral' },
      },
    ],
    messages: [{ role: 'user', content: questionPrompt }],
  });

  const question = (response.content[0] as Anthropic.TextBlock).text;
  const prefix =
    elder.language === 'ja'
      ? '📖 今週の特別な質問です —\n\n'
      : '📖 이번 주 특별 질문이에요 —\n\n';

  return prefix + question;
}

// 매월 말: 회고록 자동 생성
export async function buildMonthlyMemoir(
  elderId: string,
  month: string  // 'YYYY-MM'
): Promise<{ id: string; monthSummary: string } | null> {
  const elder = await getElderById(elderId);
  const conversations = await getMonthlyConversations(elderId, month);

  if (conversations.length < 2) return null;

  const structurePrompt =
    elder.language === 'ja'
      ? buildJaStructurePrompt(elder.name, conversations)
      : buildKoStructurePrompt(elder.name, conversations);

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 3000,
    system: [
      {
        type: 'text',
        text: elder.language === 'ja'
          ? 'あなたは高齢者の回顧録を執筆する作家です。本人の言葉を大切にし、品のある温かみのある文体で書いてください。JSONのみ出力。'
          : '당신은 어르신의 회고록을 집필하는 작가입니다. 어르신의 말투를 살리고 따뜻한 문체로 써주세요. JSON만 출력.',
        cache_control: { type: 'ephemeral' },
      },
    ],
    messages: [{ role: 'user', content: structurePrompt }],
  });

  const rawText = (response.content[0] as Anthropic.TextBlock).text;
  // JSON 파싱 안전 처리 (마크다운 코드 블록 제거)
  const jsonText = rawText.replace(/^```json?\n?/, '').replace(/\n?```$/, '');
  const { chapters, monthSummary } = JSON.parse(jsonText) as {
    chapters: MemoirChapter[];
    monthSummary: string;
  };

  const memoir = await saveMemoir(elderId, month, chapters);
  const pdfUrl = `${process.env.BASE_URL}/memoir/${memoir.id}`;

  await notifyGuardiansNewMemoir(elder, memoir.id, pdfUrl, monthSummary);

  return { id: memoir.id, monthSummary };
}

function buildJaStructurePrompt(
  name: string,
  conversations: Awaited<ReturnType<typeof getMonthlyConversations>>
): string {
  const convText = conversations
    .map(c => `質問: ${c.question}\n回答: ${c.answer}`)
    .join('\n\n');

  return `以下の会話を、美しい回顧録の章にまとめてください。

会話内容:
${convText}

JSON形式で出力:
{
  "chapters": [
    {
      "title": "章のタイトル",
      "content": "2〜3段落の物語調の文章（本人の言葉のニュアンスを大切に）",
      "quote": "印象的な一言（本人の言葉をそのまま）",
      "photoUrl": null
    }
  ],
  "monthSummary": "今月を一言で表すと..."
}

注意:
- 本人が話していない内容を追加しないこと
- 品のある、温かみのある文体
- JSONのみ出力、前置き不要`;
}

function buildKoStructurePrompt(
  name: string,
  conversations: Awaited<ReturnType<typeof getMonthlyConversations>>
): string {
  const convText = conversations
    .map(c => `질문: ${c.question}\n답변: ${c.answer}`)
    .join('\n\n');

  return `아래 대화를 아름다운 회고록 챕터로 구성해주세요.

대화 내용:
${convText}

JSON 형식 출력:
{
  "chapters": [
    {
      "title": "챕터 제목",
      "content": "2~3문단 서사 (어르신 말투 살려서)",
      "quote": "인상적인 한 마디 (어르신 말 그대로)",
      "photoUrl": null
    }
  ],
  "monthSummary": "이번 달을 한 마디로..."
}

주의: 없는 내용 추가 금지 / JSON만 출력`;
}

async function notifyGuardiansNewMemoir(
  elder: Elder,
  memoirId: string,
  pdfUrl: string,
  monthSummary: string
): Promise<void> {
  const guardians = await getGuardians(elder.id);
  const lang = elder.language as 'ja' | 'ko';

  const month = new Date().toISOString().slice(0, 7);
  const message =
    i18n[lang].memoirNotify(elder.name, month, monthSummary) +
    `\n\n${pdfUrl}`;

  await Promise.all(
    guardians.map(guardian => sendGuardianNotification(guardian, message))
  );

  await markMemoirSent(memoirId, pdfUrl);
}
