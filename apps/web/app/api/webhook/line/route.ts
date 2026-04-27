import { NextRequest, NextResponse } from 'next/server';
import { createHmac } from 'crypto';
import { processElderReply, sendLineReply } from '@oneuldo/ai';
import { getElderByLineUserId, createElder } from '@oneuldo/db/queries';

interface LineMessage {
  type: string;
  text?: string;
  id?: string;
}

interface LineEvent {
  type: string;
  message?: LineMessage;
  source: { userId: string };
  replyToken?: string;
}

interface LineWebhookBody {
  events: LineEvent[];
}

function verifyLineSignature(body: string, signature: string): boolean {
  const secret = process.env.LINE_CHANNEL_SECRET ?? '';
  const hash = createHmac('sha256', secret).update(body).digest('base64');
  return hash === signature;
}

async function handleFollowEvent(lineUserId: string, replyToken: string) {
  let elder = await getElderByLineUserId(lineUserId);
  if (!elder) {
    elder = await createElder({ name: 'ご利用者', language: 'ja', lineUserId });
    console.log('[LINE follow] 신규 어르신 등록:', elder.id, lineUserId);
  }
  const welcome =
    elder.language === 'ko'
      ? `안녕하세요! 저는 오늘도요 AI 친구예요 😊\n매일 말을 걸게요. 편하게 답장해 주세요!`
      : `こんにちは！今日もねのAIお友達です 😊\n毎日お話しかけますね。気軽に返事してください！`;
  await sendLineReply(replyToken, welcome);
}

async function handleMessageEvent(event: LineEvent) {
  const lineUserId = event.source.userId;
  const msgType = event.message?.type;

  if (msgType !== 'text' && msgType !== 'image') return;

  let elder = await getElderByLineUserId(lineUserId);
  if (!elder) {
    elder = await createElder({ name: 'ご利用者', language: 'ja', lineUserId });
    console.log('[LINE] 신규 어르신 자동 등록:', elder.id);
  }

  const text = event.message?.text ?? '';
  const imageMessageId = msgType === 'image' ? event.message?.id : undefined;

  console.log('[LINE] ▶ 처리 시작 elderId:', elder.id, '/ text:', text);

  // AI 처리는 백그라운드 — 웹훅은 즉시 200 리턴
  processElderReply(elder.id, text, undefined, event.replyToken, imageMessageId)
    .then(() => console.log('[LINE] ✓ AI 답장 완료 elderId:', elder.id))
    .catch(err => console.error('[LINE] ✗ processElderReply 실패:', err));
}

// POST /api/webhook/line
export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get('x-line-signature') ?? '';

  if (!verifyLineSignature(rawBody, signature)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  const body = JSON.parse(rawBody) as LineWebhookBody;

  for (const event of body.events) {
    if (event.type === 'follow' && event.replyToken) {
      // follow는 가볍고 빠르니 await 가능
      await handleFollowEvent(event.source.userId, event.replyToken).catch(err =>
        console.error('[LINE follow] 실패:', err)
      );
    } else if (event.type === 'message') {
      // message는 fire-and-forget
      handleMessageEvent(event).catch(() => {});
    }
  }

  return NextResponse.json({ ok: true });
}
