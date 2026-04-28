import type { Elder, Guardian } from '@oneuldo/types';

// ─── 어르신 앱 Push (Flutter) ─────────────────────────────────────────────────

export async function sendPushNotification(
  pushToken: string | undefined,
  message: string
): Promise<void> {
  if (!pushToken) return;
  await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      to: pushToken,
      title: '今日もね / 오늘도요',
      body: message,
      sound: 'default',
    }),
  }).catch(err => console.error('[Push] Failed:', err));
}

export async function sendReplyToElder(elder: Elder, message: string): Promise<void> {
  await sendPushNotification(elder.pushToken, message);
}

// ─── 보호자(가족) 단방향 알림 ─────────────────────────────────────────────────
// 이상감지·회고록 알림은 보호자의 LINE/이메일로 전송

export async function sendGuardianLineMessage(
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
  }).catch(err => console.error('[LINE guardian push] Failed:', err));
}

// 카카오 알림톡: 비즈니스 계정 + 템플릿 승인 필요 (KAKAO_SENDER_KEY 설정 후 활성화)
export async function sendGuardianKakaoMessage(
  _kakaoUserId: string,
  _message: string
): Promise<void> {
  const senderKey = process.env.KAKAO_SENDER_KEY;
  if (!senderKey) {
    console.warn('[Kakao] KAKAO_SENDER_KEY not set — skipping');
    return;
  }
  // TODO: 알림톡 템플릿 승인 후 구현
  // POST https://api-alimtalk.kakao.com/alimtalk/v2/sender/{senderKey}/message
  console.warn('[Kakao] 알림톡 not yet implemented — set KAKAO_SENDER_KEY and template');
}

// ─── 이메일 알림 (Resend) ─────────────────────────────────────────────────────

export async function sendGuardianEmail(
  email: string,
  subject: string,
  text: string
): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return;

  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      from: 'TodayToo <noreply@resend.dev>',
      to: [email],
      subject,
      text,
    }),
  }).catch(err => console.error('[Resend email] Failed:', err));
}

// ─── 통합 보호자 알림 ─────────────────────────────────────────────────────────

export async function sendGuardianNotification(
  guardian: Guardian,
  message: string,
  subject?: string
): Promise<void> {
  const tasks: Promise<void>[] = [];

  if (guardian.lineUserId) {
    tasks.push(sendGuardianLineMessage(guardian.lineUserId, message));
  }
  if (guardian.kakaoUserId) {
    tasks.push(sendGuardianKakaoMessage(guardian.kakaoUserId, message));
  }

  // 이메일은 LINE/카카오가 없을 때 fallback (있으면 함께 발송)
  if (guardian.email && !guardian.email.endsWith('@placeholder.local')) {
    const emailSubject = subject ?? '오늘도요 알림 / 今日もね通知';
    tasks.push(sendGuardianEmail(guardian.email, emailSubject, message));
  }

  await Promise.allSettled(tasks);
}
