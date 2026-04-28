import { supabase } from './index';
import type {
  Elder, Guardian, Conversation, ConcernLog, Memoir,
  ElderContext, ResponsePattern, MemoirChapter, Language,
  GuardianRole, ConversationModule
} from '@oneuldo/types';

// ─── Mappers (snake_case → camelCase) ────────────────────────────────────────

function toDate(v: unknown): Date { return new Date(v as string); }
function toDateOpt(v: unknown): Date | undefined { return v ? new Date(v as string) : undefined; }

function mapElder(r: Record<string, unknown>): Elder {
  return {
    id: r.id as string,
    name: r.name as string,
    language: r.language as Language,
    timezone: r.timezone as string,
    pushToken: r.push_token as string | undefined,
    createdAt: toDate(r.created_at),
  };
}

function mapGuardian(r: Record<string, unknown>): Guardian {
  return {
    id: r.id as string,
    elderId: r.elder_id as string,
    name: r.name as string,
    role: r.role as GuardianRole,
    email: r.email as string,
    language: r.language as Language,
    lineUserId: r.line_user_id as string | undefined,
    kakaoUserId: r.kakao_user_id as string | undefined,
    createdAt: toDate(r.created_at),
  };
}

function mapConversation(r: Record<string, unknown>): Conversation {
  return {
    id: r.id as string,
    elderId: r.elder_id as string,
    module: r.module as ConversationModule,
    question: r.question as string,
    answer: r.answer as string | undefined,
    photoUrls: (r.photo_urls ?? []) as string[],
    emotionTags: (r.emotion_tags ?? []) as string[],
    weekNumber: r.week_number as number | undefined,
    createdAt: toDate(r.created_at),
  };
}

function mapConcernLog(r: Record<string, unknown>): ConcernLog {
  return {
    id: r.id as string,
    elderId: r.elder_id as string,
    level: r.level as 'low' | 'medium' | 'high',
    reason: r.reason as string,
    notified: r.notified as boolean,
    createdAt: toDate(r.created_at),
  };
}

function mapMemoir(r: Record<string, unknown>): Memoir {
  return {
    id: r.id as string,
    elderId: r.elder_id as string,
    month: r.month as string,
    chapters: r.chapters as MemoirChapter[],
    pdfUrl: r.pdf_url as string | undefined,
    sentAt: toDateOpt(r.sent_at),
    createdAt: toDate(r.created_at),
  };
}

// ─── Elder ───────────────────────────────────────────────────────────────────

export async function getElderById(id: string): Promise<Elder> {
  const { data, error } = await supabase
    .from('elders').select('*').eq('id', id).single();
  if (error || !data) throw new Error(`Elder not found: ${id}`);
  return mapElder(data);
}

export async function getAllElders(): Promise<Elder[]> {
  const { data } = await supabase
    .from('elders').select('*').order('created_at', { ascending: false });
  return (data ?? []).map(mapElder);
}

export async function createElder(data: {
  name: string;
  language: Language;
  timezone?: string;
  pushToken?: string;
}): Promise<Elder> {
  const { data: row, error } = await supabase
    .from('elders')
    .insert({
      name: data.name,
      language: data.language,
      timezone: data.timezone ?? (data.language === 'ja' ? 'Asia/Tokyo' : 'Asia/Seoul'),
      push_token: data.pushToken ?? null,
    })
    .select('*').single();
  if (error || !row) throw new Error('Failed to create elder');
  return mapElder(row);
}

export async function updateElderPushToken(id: string, pushToken: string): Promise<void> {
  await supabase.from('elders').update({ push_token: pushToken }).eq('id', id);
}

// ─── Guardian ─────────────────────────────────────────────────────────────────

export async function getGuardians(elderId: string): Promise<Guardian[]> {
  const { data } = await supabase
    .from('guardians').select('*').eq('elder_id', elderId);
  return (data ?? []).map(mapGuardian);
}

export async function createGuardian(data: {
  elderId: string;
  name: string;
  role: string;
  email: string;
  language: Language;
  lineUserId?: string;
  kakaoUserId?: string;
}): Promise<Guardian> {
  const payload: Record<string, unknown> = {
    elder_id: data.elderId,
    name: data.name,
    role: data.role,
    email: data.email,
    language: data.language,
  };
  if (data.lineUserId !== undefined) payload.line_user_id = data.lineUserId;
  if (data.kakaoUserId !== undefined) payload.kakao_user_id = data.kakaoUserId;

  const { data: row, error } = await supabase
    .from('guardians')
    .insert(payload)
    .select('*').single();
  if (error || !row) throw new Error(`Failed to create guardian: ${error?.message}`);
  return mapGuardian(row);
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
  const { data: row, error } = await supabase
    .from('conversations')
    .insert({
      elder_id: data.elderId,
      module: data.module,
      question: data.question,
      answer: data.answer ?? null,
      photo_urls: data.photoUrls ?? [],
      emotion_tags: data.emotionTags ?? [],
      week_number: data.weekNumber ?? null,
    })
    .select('*').single();
  if (error || !row) throw new Error('Failed to save conversation');
  return mapConversation(row);
}

export async function getRecentConversations(elderId: string, limit = 10): Promise<Conversation[]> {
  const { data } = await supabase
    .from('conversations').select('*')
    .eq('elder_id', elderId)
    .order('created_at', { ascending: false })
    .limit(limit);
  return (data ?? []).map(mapConversation);
}

export async function getMonthlyConversations(elderId: string, month: string): Promise<Conversation[]> {
  const [year, mon] = month.split('-').map(Number);
  const start = new Date(year, mon - 1, 1).toISOString();
  const end = new Date(year, mon, 1).toISOString();

  const { data } = await supabase
    .from('conversations').select('*')
    .eq('elder_id', elderId)
    .gte('created_at', start)
    .lt('created_at', end)
    .not('answer', 'is', null)
    .order('created_at', { ascending: true });
  return (data ?? []).map(mapConversation);
}

// ─── Concern Log ──────────────────────────────────────────────────────────────

export async function logConcern(
  elderId: string,
  level: 'low' | 'medium' | 'high',
  reason: string
): Promise<ConcernLog> {
  const { data: row, error } = await supabase
    .from('concern_logs')
    .insert({ elder_id: elderId, level, reason })
    .select('*').single();
  if (error || !row) throw new Error('Failed to log concern');
  return mapConcernLog(row);
}

export async function getRecentConcernLogs(elderId: string, days = 7): Promise<ConcernLog[]> {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
  const { data } = await supabase
    .from('concern_logs').select('*')
    .eq('elder_id', elderId)
    .gte('created_at', since)
    .order('created_at', { ascending: false });
  return (data ?? []).map(mapConcernLog);
}

export async function markConcernNotified(id: string): Promise<void> {
  await supabase.from('concern_logs').update({ notified: true }).eq('id', id);
}

// ─── Elder Context ────────────────────────────────────────────────────────────

export async function getElderContext(elderId: string): Promise<ElderContext> {
  const [recentConvs, concernLogs, responseStats] = await Promise.all([
    getRecentConversations(elderId, 20),
    getRecentConcernLogs(elderId, 3),
    getResponsePattern(elderId),
  ]);

  const negativeEmotions = ['슬픔', '외로움', '그리움', '우울', '寂しさ', '悲しみ'];
  const recentTopics = recentConvs
    .flatMap(c => (c.emotionTags as string[]) ?? [])
    .filter(Boolean).slice(0, 5);

  const negativeEmotionCount = recentConvs
    .flatMap(c => (c.emotionTags as string[]) ?? [])
    .filter(tag => negativeEmotions.some(n => tag.includes(n))).length;

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
  const { data: convs } = await supabase
    .from('conversations').select('created_at')
    .eq('elder_id', elderId)
    .not('answer', 'is', null)
    .order('created_at', { ascending: false })
    .limit(20);

  if (!convs || convs.length === 0) {
    return { hoursSinceLastReply: 999, avgResponseDelay: 60, todayResponseDelay: 9999, negativeEmotionCount: 0 };
  }

  const now = Date.now();
  const hoursSinceLastReply = (now - new Date(convs[0].created_at).getTime()) / (1000 * 60 * 60);

  let totalDelay = 0;
  for (let i = 0; i < convs.length - 1; i++) {
    totalDelay += (new Date(convs[i].created_at).getTime() - new Date(convs[i + 1].created_at).getTime()) / (1000 * 60);
  }
  const avgResponseDelay = convs.length > 1 ? totalDelay / (convs.length - 1) : 60;

  const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
  const todayConv = convs.find(c => new Date(c.created_at) >= todayStart);
  const todayResponseDelay = todayConv
    ? (now - new Date(todayConv.created_at).getTime()) / (1000 * 60)
    : 9999;

  return { hoursSinceLastReply, avgResponseDelay, todayResponseDelay, negativeEmotionCount: 0 };
}

// ─── Memoir ───────────────────────────────────────────────────────────────────

export async function saveMemoir(elderId: string, month: string, chapters: MemoirChapter[]): Promise<Memoir> {
  const { data: row, error } = await supabase
    .from('memoirs')
    .upsert({ elder_id: elderId, month, chapters }, { onConflict: 'elder_id,month' })
    .select('*').single();
  if (error || !row) throw new Error('Failed to save memoir');
  return mapMemoir(row);
}

export async function getMemoirById(id: string): Promise<(Memoir & { elder: Elder }) | null> {
  const { data } = await supabase
    .from('memoirs').select('*, elders(*)').eq('id', id).maybeSingle();
  if (!data) return null;
  return { ...mapMemoir(data), elder: mapElder(data.elders as Record<string, unknown>) };
}

export async function getMemoirsByElder(elderId: string): Promise<Memoir[]> {
  const { data } = await supabase
    .from('memoirs').select('*')
    .eq('elder_id', elderId)
    .order('month', { ascending: false });
  return (data ?? []).map(mapMemoir);
}

export async function markMemoirSent(id: string, pdfUrl: string): Promise<void> {
  await supabase.from('memoirs')
    .update({ pdf_url: pdfUrl, sent_at: new Date().toISOString() }).eq('id', id);
}

// ─── Invite Token ─────────────────────────────────────────────────────────────

export async function createInviteToken(elderId: string): Promise<string> {
  const token = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  await supabase.from('invite_tokens').insert({ elder_id: elderId, token, expires_at: expiresAt });
  return token;
}

export async function consumeInviteToken(token: string): Promise<{ elderId: string } | null> {
  const { data } = await supabase
    .from('invite_tokens')
    .update({ used: true })
    .eq('token', token).eq('used', false)
    .gt('expires_at', new Date().toISOString())
    .select('elder_id').maybeSingle();
  return data ? { elderId: data.elder_id as string } : null;
}
