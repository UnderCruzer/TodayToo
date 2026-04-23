import type { Elder, ConcernLevel } from '@oneuldo/types';
import {
  getAllElders,
  getElderById,
  getGuardians,
  getResponsePattern,
  getRecentConcernLogs,
  logConcern,
  markConcernNotified,
} from '@oneuldo/db/queries';
import { sendGuardianNotification } from './notifications';

interface ConcernCheck {
  condition: boolean;
  level: ConcernLevel;
  reason: string;
}

export async function runDailyConcernCheck(elderId: string): Promise<void> {
  const elder = await getElderById(elderId);
  const lang = elder.language as 'ja' | 'ko';
  const pattern = await getResponsePattern(elderId);
  const recentLogs = await getRecentConcernLogs(elderId, 3);

  // 최근 3일 감정 태그에 부정어 카운트
  const negativeEmotionCount = pattern.negativeEmotionCount;

  const checks: ConcernCheck[] = [
    {
      condition: pattern.hoursSinceLastReply > 72,
      level: 'high',
      reason:
        lang === 'ja'
          ? '72時間以上返信がありません'
          : '72시간 이상 응답이 없습니다',
    },
    {
      condition:
        pattern.todayResponseDelay > pattern.avgResponseDelay * 2 &&
        pattern.todayResponseDelay > 120,
      level: 'low',
      reason:
        lang === 'ja'
          ? 'いつもより返信が遅れています'
          : '평소보다 응답이 늦습니다',
    },
    {
      condition: negativeEmotionCount >= 3,
      level: 'medium',
      reason:
        lang === 'ja'
          ? '最近、寂しさや悲しみを多く表現されています'
          : '최근 외로움·슬픔 표현이 많습니다',
    },
  ];

  // 오늘 이미 같은 레벨 알림 발송했으면 중복 방지
  const todayLevels = new Set(recentLogs.map(l => l.level));

  for (const check of checks) {
    if (!check.condition) continue;
    if (todayLevels.has(check.level)) continue;

    const log = await logConcern(elderId, check.level, check.reason);
    await notifyGuardians(elder, check.level, check.reason);
    await markConcernNotified(log.id);
  }
}

export async function runAllConcernChecks(): Promise<void> {
  const elders = await getAllElders();
  await Promise.allSettled(elders.map(e => runDailyConcernCheck(e.id)));
}

async function notifyGuardians(
  elder: Elder,
  level: ConcernLevel,
  reason: string
): Promise<void> {
  const guardians = await getGuardians(elder.id);

  const messages = {
    ja: {
      low: `💛 ${elder.name}さんからの返信が少し遅れています。\n理由: ${reason}`,
      medium: `⚠️ ${elder.name}さんの状態が少し心配です。\n${reason}\n近いうちに連絡してみてください。`,
      high: `🚨 緊急 | ${elder.name}さんと連絡が取れていません。\n${reason}\nすぐに確認をお願いします。`,
    },
    ko: {
      low: `💛 ${elder.name}님 응답이 조금 늦어지고 있어요.\n사유: ${reason}`,
      medium: `⚠️ ${elder.name}님 상태가 조금 걱정됩니다.\n${reason}\n가까운 시일 내 연락해보세요.`,
      high: `🚨 긴급 | ${elder.name}님과 연락이 닿지 않고 있어요.\n${reason}\n즉시 확인 부탁드립니다.`,
    },
  } as const;

  await Promise.allSettled(
    guardians.map(guardian => {
      const lang = (guardian.language as 'ja' | 'ko') ?? (elder.language as 'ja' | 'ko');
      return sendGuardianNotification(guardian, messages[lang][level]);
    })
  );
}
