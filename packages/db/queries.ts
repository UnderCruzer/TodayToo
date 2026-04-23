import { query, queryOne } from './index';
import type {
  Elder, Guardian, Conversation, ConcernLog, Memoir,
  ElderContext, ResponsePattern, MemoirChapter, Language
} from '@oneuldo/types';

// ─── Elder ───────────────────────────────────────────────────────────────────

export async function getElderById(id: string): Promise<Elder> {
  const row = await queryOne<Elder>(
    `SELECT id, name, language, timezone,
            line_user_id AS "lineUserId",
            kakao_user_id AS "kakaoUserId",
            push_token AS "pushToken",
            created_at AS "createdAt"
     FROM elders WHERE id = $1`,
    [id]
  );
  if (!row) throw new Error(`Elder not found: ${id}`);
  return row;
}

export async function getElderByLineUserId(lineUserId: string): Promise<Elder | null> {
  return queryOne<Elder>(
    `SELECT id, name, language, timezone,
            line_user_id AS "lineUserId",
            kakao_user_id AS "kakaoUserId",
            push_token AS "pushToken",
            created_at AS "createdAt"
     FROM elders WHERE line_user_id = $1`,
    [lineUserId]
  );
}

export async function getElderByKakaoUserId(kakaoUserId: string): Promise<Elder | null> {
  return queryOne<Elder>(
    `SELECT id, name, language, timezone,
            line_user_id AS "lineUserId",
            kakao_user_id AS "kakaoUserId",
            push_token AS "pushToken",
            created_at AS "createdAt"
     FROM elders WHERE kakao_user_id = $1`,
    [kakaoUserId]
  );
}

export async function getAllElders(): Promise<Elder[]> {
  return query<Elder>(
    `SELECT id, name, language, timezone,
            line_user_id AS "lineUserId",
            kakao_user_id AS "kakaoUserId",
            push_token AS "pushToken",
            created_at AS "createdAt"
     FROM elders ORDER BY created_at DESC`
  );
}

export async function createElder(data: {
  name: string;
  language: Language;
  timezone?: string;
  lineUserId?: string;
  kakaoUserId?: string;
  pushToken?: string;
}): Promise<Elder> {
  const row = await queryOne<Elder>(
    `INSERT INTO elders (name, language, timezone, line_user_id, kakao_user_id, push_token)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id, name, language, timezone,
               line_user_id AS "lineUserId",
               kakao_user_id AS "kakaoUserId",
               push_token AS "pushToken",
               created_at AS "createdAt"`,
    [
      data.name,
      data.language,
      data.timezone ?? (data.language === 'ja' ? 'Asia/Tokyo' : 'Asia/Seoul'),
      data.lineUserId ?? null,
      data.kakaoUserId ?? null,
      data.pushToken ?? null,
    ]
  );
  return row!;
}

export async function updateElderPushToken(id: string, pushToken: string): Promise<void> {
  await query(`UPDATE elders SET push_token = $1 WHERE id = $2`, [pushToken, id]);
}

// ─── Guardian ─────────────────────────────────────────────────────────────────

export async function getGuardians(elderId: string): Promise<Guardian[]> {
  return query<Guardian>(
    `SELECT id, elder_id AS "elderId", name, role, email, language,
            created_at AS "createdAt"
     FROM guardians WHERE elder_id = $1`,
    [elderId]
  );
}

export async function createGuardian(data: {
  elderId: string;
  name: string;
  role: string;
  email: string;
  language: Language;
}): Promise<Guardian> {
  const row = await queryOne<Guardian>(
    `INSERT INTO guardians (elder_id, name, role, email, language)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, elder_id AS "elderId", name, role, email, language,
               created_at AS "createdAt"`,
    [data.elderId, data.name, data.role, data.email, data.language]
  );
  return row!;
}

// ─── Conversation ─────────────────────────────────────────────────────────────

export async function saveConversation(data: {
  elderId: string;
  module: 'daily' | 'memoir';
  question: string;
  answer?: string;
  photoUrls?: string[];
  emotionTags?: string[];
  weekNumber?: number;
}): Promise<Conversation> {
  const row = await queryOne<Conversation>(
    `INSERT INTO conversations
       (elder_id, module, question, answer, photo_urls, emotion_tags, week_number)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING id, elder_id AS "elderId", module, question, answer,
               photo_urls AS "photoUrls",
               emotion_tags AS "emotionTags",
               week_number AS "weekNumber",
               created_at AS "createdAt"`,
    [
      data.elderId,
      data.module,
      data.question,
      data.answer ?? null,
      JSON.stringify(data.photoUrls ?? []),
      JSON.stringify(data.emotionTags ?? []),
      data.weekNumber ?? null,
    ]
  );
  return row!;
}

export async function getRecentConversations(
  elderId: string,
  limit = 10
): Promise<Conversation[]> {
  return query<Conversation>(
    `SELECT id, elder_id AS "elderId", module, question, answer,
            photo_urls AS "photoUrls",
            emotion_tags AS "emotionTags",
            week_number AS "weekNumber",
            created_at AS "createdAt"
     FROM conversations
     WHERE elder_id = $1
     ORDER BY created_at DESC
     LIMIT $2`,
    [elderId, limit]
  );
}

export async function getMonthlyConversations(
  elderId: string,
  month: string  // 'YYYY-MM'
): Promise<Conversation[]> {
  return query<Conversation>(
    `SELECT id, elder_id AS "elderId", module, question, answer,
            photo_urls AS "photoUrls",
            emotion_tags AS "emotionTags",
            week_number AS "weekNumber",
            created_at AS "createdAt"
     FROM conversations
     WHERE elder_id = $1
       AND to_char(created_at, 'YYYY-MM') = $2
       AND answer IS NOT NULL
     ORDER BY created_at ASC`,
    [elderId, month]
  );
}

// ─── Concern Log ──────────────────────────────────────────────────────────────

export async function logConcern(
  elderId: string,
  level: 'low' | 'medium' | 'high',
  reason: string
): Promise<ConcernLog> {
  const row = await queryOne<ConcernLog>(
    `INSERT INTO concern_logs (elder_id, level, reason)
     VALUES ($1, $2, $3)
     RETURNING id, elder_id AS "elderId", level, reason, notified,
               created_at AS "createdAt"`,
    [elderId, level, reason]
  );
  return row!;
}

export async function getRecentConcernLogs(elderId: string, days = 7): Promise<ConcernLog[]> {
  return query<ConcernLog>(
    `SELECT id, elder_id AS "elderId", level, reason, notified,
            created_at AS "createdAt"
     FROM concern_logs
     WHERE elder_id = $1
       AND created_at > NOW() - INTERVAL '1 day' * $2
     ORDER BY created_at DESC`,
    [elderId, days]
  );
}

export async function markConcernNotified(id: string): Promise<void> {
  await query(`UPDATE concern_logs SET notified = TRUE WHERE id = $1`, [id]);
}

// ─── Elder Context (for AI modules) ──────────────────────────────────────────

export async function getElderContext(elderId: string): Promise<ElderContext> {
  const [recentConvs, concernLogs, responseStats] = await Promise.all([
    getRecentConversations(elderId, 20),
    getRecentConcernLogs(elderId, 3),
    getResponsePattern(elderId),
  ]);

  const recentTopics = recentConvs
    .flatMap(c => (c.emotionTags as string[]) ?? [])
    .filter(Boolean)
    .slice(0, 5);

  const negativeEmotions = ['슬픔', '외로움', '그리움', '우울', '寂しさ', '悲しみ'];
  const negativeEmotionCount = recentConvs
    .flatMap(c => (c.emotionTags as string[]) ?? [])
    .filter(tag => negativeEmotions.some(n => tag.includes(n)))
    .length;

  return {
    recentTopics,
    lastConcernFlag: concernLogs[0] ?? undefined,
    avgResponseDelay: responseStats.avgResponseDelay,
    todayResponseDelay: responseStats.todayResponseDelay,
    hoursSinceLastReply: responseStats.hoursSinceLastReply,
    negativeEmotionCount,
  };
}

export async function getResponsePattern(elderId: string): Promise<ResponsePattern> {
  const row = await queryOne<{
    hours_since_last: string;
    avg_delay_minutes: string;
    today_delay_minutes: string;
  }>(
    `WITH last_reply AS (
       SELECT created_at FROM conversations
       WHERE elder_id = $1 AND answer IS NOT NULL
       ORDER BY created_at DESC LIMIT 1
     ),
     avg_delay AS (
       SELECT AVG(
         EXTRACT(EPOCH FROM (created_at - LAG(created_at) OVER (ORDER BY created_at))) / 60
       ) AS avg_minutes
       FROM conversations
       WHERE elder_id = $1 AND answer IS NOT NULL
     ),
     today_last AS (
       SELECT created_at FROM conversations
       WHERE elder_id = $1 AND answer IS NOT NULL
         AND created_at::date = CURRENT_DATE
       ORDER BY created_at DESC LIMIT 1
     )
     SELECT
       COALESCE(
         EXTRACT(EPOCH FROM (NOW() - (SELECT created_at FROM last_reply))) / 3600,
         999
       ) AS hours_since_last,
       COALESCE((SELECT avg_minutes FROM avg_delay), 60) AS avg_delay_minutes,
       COALESCE(
         EXTRACT(EPOCH FROM (NOW() - (SELECT created_at FROM today_last))) / 60,
         9999
       ) AS today_delay_minutes`,
    [elderId]
  );

  return {
    hoursSinceLastReply: parseFloat(row?.hours_since_last ?? '999'),
    avgResponseDelay: parseFloat(row?.avg_delay_minutes ?? '60'),
    todayResponseDelay: parseFloat(row?.today_delay_minutes ?? '9999'),
    negativeEmotionCount: 0,
  };
}

// ─── Memoir ───────────────────────────────────────────────────────────────────

export async function saveMemoir(
  elderId: string,
  month: string,
  chapters: MemoirChapter[]
): Promise<Memoir> {
  const row = await queryOne<Memoir>(
    `INSERT INTO memoirs (elder_id, month, chapters)
     VALUES ($1, $2, $3)
     ON CONFLICT (elder_id, month) DO UPDATE SET chapters = $3
     RETURNING id, elder_id AS "elderId", month, chapters,
               pdf_url AS "pdfUrl", sent_at AS "sentAt",
               created_at AS "createdAt"`,
    [elderId, month, JSON.stringify(chapters)]
  );
  return row!;
}

export async function getMemoirById(id: string): Promise<(Memoir & { elder: Elder }) | null> {
  const row = await queryOne<Memoir & { elder: Elder }>(
    `SELECT m.id, m.elder_id AS "elderId", m.month, m.chapters,
            m.pdf_url AS "pdfUrl", m.sent_at AS "sentAt",
            m.created_at AS "createdAt",
            json_build_object(
              'id', e.id,
              'name', e.name,
              'language', e.language,
              'timezone', e.timezone
            ) AS elder
     FROM memoirs m
     JOIN elders e ON e.id = m.elder_id
     WHERE m.id = $1`,
    [id]
  );
  return row;
}

export async function getMemoirsByElder(elderId: string): Promise<Memoir[]> {
  return query<Memoir>(
    `SELECT id, elder_id AS "elderId", month, chapters,
            pdf_url AS "pdfUrl", sent_at AS "sentAt",
            created_at AS "createdAt"
     FROM memoirs WHERE elder_id = $1 ORDER BY month DESC`,
    [elderId]
  );
}

export async function markMemoirSent(id: string, pdfUrl: string): Promise<void> {
  await query(
    `UPDATE memoirs SET pdf_url = $1, sent_at = NOW() WHERE id = $2`,
    [pdfUrl, id]
  );
}

// ─── Invite Token ─────────────────────────────────────────────────────────────

export async function createInviteToken(elderId: string): Promise<string> {
  const token = crypto.randomUUID();
  await query(
    `INSERT INTO invite_tokens (elder_id, token, expires_at)
     VALUES ($1, $2, NOW() + INTERVAL '7 days')`,
    [elderId, token]
  );
  return token;
}

export async function consumeInviteToken(
  token: string
): Promise<{ elderId: string } | null> {
  const row = await queryOne<{ elder_id: string }>(
    `UPDATE invite_tokens
     SET used = TRUE
     WHERE token = $1 AND used = FALSE AND expires_at > NOW()
     RETURNING elder_id`,
    [token]
  );
  return row ? { elderId: row.elder_id } : null;
}
