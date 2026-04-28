import { NextRequest, NextResponse } from 'next/server';
import { createHmac } from 'crypto';
import { consumeInviteToken, createGuardian } from '@oneuldo/db/queries';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function verifySignature(body: string, signature: string): boolean {
  const secret = process.env.LINE_CHANNEL_SECRET ?? '';
  const expected = createHmac('sha256', secret).update(body).digest('base64');
  return expected === signature;
}

async function replyLine(replyToken: string, text: string): Promise<void> {
  const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  if (!token) return;
  await fetch('https://api.line.me/v2/bot/message/reply', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      replyToken,
      messages: [{ type: 'text', text }],
    }),
  }).catch(err => console.error('[LINE reply]', err));
}

interface LineEvent {
  type: string;
  replyToken?: string;
  message?: { type: string; text?: string };
  source?: { type: string; userId?: string };
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const rawBody = await req.text();
  const signature = req.headers.get('x-line-signature') ?? '';

  if (!verifySignature(rawBody, signature)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  let body: { events: LineEvent[] };
  try {
    body = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: 'Bad JSON' }, { status: 400 });
  }

  for (const event of body.events ?? []) {
    if (event.type !== 'message') continue;
    if (event.message?.type !== 'text') continue;

    const text = (event.message.text ?? '').trim();
    const lineUserId = event.source?.userId;
    const replyToken = event.replyToken;

    if (!lineUserId || !replyToken) continue;

    // 초대 토큰을 보낸 경우 → 보호자 자동 등록
    if (UUID_RE.test(text)) {
      try {
        const result = await consumeInviteToken(text);
        if (!result) {
          await replyLine(replyToken,
            '유효하지 않거나 만료된 초대 코드입니다.\n無効または期限切れの招待コードです。'
          );
          continue;
        }

        await createGuardian({
          elderId: result.elderId,
          name: 'LINE 보호자',
          email: `line_${lineUserId}@placeholder.local`,
          role: 'family',
          language: 'ja',
          lineUserId,
        });

        await replyLine(replyToken,
          '✅ 보호자 등록이 완료되었습니다! 이상감지 알림을 LINE으로 받으실 수 있습니다.\n' +
          '✅ 保護者として登録されました！異常検知の通知がLINEに届きます。'
        );
      } catch (err) {
        console.error('[LINE webhook] guardian register error:', err);
        await replyLine(replyToken,
          '등록 중 오류가 발생했습니다. 다시 시도해주세요.\n登録中にエラーが発生しました。'
        );
      }
      continue;
    }

    // 기타 메시지 → 안내 응답
    await replyLine(replyToken,
      '안녕하세요! 보호자 등록을 하시려면 초대 코드를 보내주세요.\n' +
      'こんにちは！保護者登録には招待コードを送ってください。'
    );
  }

  return NextResponse.json({ ok: true });
}
