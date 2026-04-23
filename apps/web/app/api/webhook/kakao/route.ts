import { NextRequest, NextResponse } from 'next/server';
import { processElderReply } from '@oneuldo/ai';
import { getElderByKakaoUserId } from '@oneuldo/db/queries';

interface KakaoMessage {
  type: string;
  text?: string;
}

interface KakaoWebhookBody {
  userRequest: {
    user: { id: string };
    utterance: string;
  };
  action?: { name: string };
}

// POST /api/webhook/kakao — 카카오 챗봇 Webhook
export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as KakaoWebhookBody;
    const kakaoUserId = body.userRequest.user.id;
    const text = body.userRequest.utterance;

    const elder = await getElderByKakaoUserId(kakaoUserId);

    if (!elder) {
      return NextResponse.json({
        version: '2.0',
        template: {
          outputs: [
            { simpleText: { text: '연결된 어르신 계정을 찾을 수 없습니다.' } },
          ],
        },
      });
    }

    processElderReply(elder.id, text).catch(err =>
      console.error('[kakao webhook]', err)
    );

    // 카카오 챗봇은 즉시 응답 필요
    return NextResponse.json({
      version: '2.0',
      template: {
        outputs: [
          {
            simpleText: {
              text: elder.language === 'ja'
                ? 'ありがとうございます。返事を考えています... 😊'
                : '감사해요. 답장을 생각하고 있어요... 😊',
            },
          },
        ],
      },
    });
  } catch (err) {
    console.error('[kakao webhook]', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
