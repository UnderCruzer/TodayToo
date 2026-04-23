import { NextRequest, NextResponse } from 'next/server';
import { createHmac } from 'crypto';
import { processElderReply } from '@oneuldo/ai';
import { getElderByLineUserId } from '@oneuldo/db/queries';

interface LineEvent {
  type: string;
  message?: { type: string; text?: string; id?: string };
  source: { userId: string };
  replyToken?: string;
}

interface LineWebhookBody {
  events: LineEvent[];
}

// LINE Webhook 서명 검증
function verifyLineSignature(body: string, signature: string): boolean {
  const secret = process.env.LINE_CHANNEL_SECRET ?? '';
  const hash = createHmac('sha256', secret)
    .update(body)
    .digest('base64');
  return hash === signature;
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
    if (event.type !== 'message') continue;
    if (event.message?.type !== 'text') continue;

    const lineUserId = event.source.userId;
    const text = event.message.text ?? '';

    const elder = await getElderByLineUserId(lineUserId);
    if (!elder) continue;

    processElderReply(elder.id, text).catch(err =>
      console.error('[line webhook]', err)
    );
  }

  return NextResponse.json({ ok: true });
}
