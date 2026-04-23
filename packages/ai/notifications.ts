import type { Elder, Guardian } from '@oneuldo/types';

// ─── Push Notification (Expo) ─────────────────────────────────────────────────

export async function sendPushNotification(
  pushToken: string | undefined,
  message: string
): Promise<void> {
  if (!pushToken) return;

  const expoEndpoint = 'https://exp.host/--/api/v2/push/send';
  const body = JSON.stringify({
    to: pushToken,
    title: '今日もね / 오늘도요',
    body: message,
    sound: 'default',
  });

  await fetch(expoEndpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
  }).catch(err => console.error('[Push] Failed:', err));
}

// ─── LINE Bot API (일본) ──────────────────────────────────────────────────────

export async function sendLineMessage(
  lineUserId: string,
  message: string
): Promise<void> {
  const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  if (!token) return;

  await fetch('https://api.line.me/v2/bot/message/push', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      to: lineUserId,
      messages: [{ type: 'text', text: message }],
    }),
  }).catch(err => console.error('[LINE] Failed:', err));
}

// ─── 카카오 알림톡 (한국) ────────────────────────────────────────────────────

export async function sendKakaoMessage(
  kakaoUserId: string,
  message: string
): Promise<void> {
  const token = process.env.KAKAO_ACCESS_TOKEN;
  if (!token) return;

  // 카카오 알림톡 API (실제 구현 시 비즈 계정 + 템플릿 승인 필요)
  await fetch('https://kapi.kakao.com/v2/api/talk/memo/default/send', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Bearer ${token}`,
    },
    body: new URLSearchParams({
      template_object: JSON.stringify({
        object_type: 'text',
        text: message,
        link: { web_url: process.env.BASE_URL ?? '' },
      }),
    }),
  }).catch(err => console.error('[Kakao] Failed:', err));
}

// ─── 어르신에게 통합 발송 ──────────────────────────────────────────────────────

export async function sendReplyToElder(
  elder: Elder,
  message: string
): Promise<void> {
  const tasks: Promise<void>[] = [];

  if (elder.pushToken) {
    tasks.push(sendPushNotification(elder.pushToken, message));
  }
  if (elder.lineUserId) {
    tasks.push(sendLineMessage(elder.lineUserId, message));
  }
  if (elder.kakaoUserId) {
    tasks.push(sendKakaoMessage(elder.kakaoUserId, message));
  }

  await Promise.allSettled(tasks);
}

// ─── 보호자(가족·기관)에게 알림 ──────────────────────────────────────────────

export async function sendGuardianNotification(
  guardian: Guardian,
  message: string
): Promise<void> {
  // 이메일 알림 (SendGrid / Resend)
  const apiKey = process.env.SENDGRID_API_KEY ?? process.env.RESEND_API_KEY;
  if (!apiKey) return;

  const isResend = !!process.env.RESEND_API_KEY;
  const endpoint = isResend
    ? 'https://api.resend.com/emails'
    : 'https://api.sendgrid.com/v3/mail/send';

  const payload = isResend
    ? JSON.stringify({
        from: 'noreply@oneuldo.app',
        to: [guardian.email],
        subject: '今日もね / 오늘도요 알림',
        text: message,
      })
    : JSON.stringify({
        personalizations: [{ to: [{ email: guardian.email }] }],
        from: { email: 'noreply@oneuldo.app' },
        subject: '今日もね / 오늘도요 알림',
        content: [{ type: 'text/plain', value: message }],
      });

  await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: payload,
  }).catch(err => console.error('[Email] Failed:', err));
}

export async function sendMessengerNotification(
  elder: Elder,
  message: string
): Promise<void> {
  if (elder.lineUserId) await sendLineMessage(elder.lineUserId, message);
  if (elder.kakaoUserId) await sendKakaoMessage(elder.kakaoUserId, message);
}
