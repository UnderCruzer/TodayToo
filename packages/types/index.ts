export type Language = 'ja' | 'ko';
export type GuardianRole = 'family' | 'welfare' | 'facility';
export type ConcernLevel = 'low' | 'medium' | 'high';
export type ConversationModule = 'daily' | 'memoir';

export interface Elder {
  id: string;
  name: string;
  language: Language;
  timezone: string;
  lineUserId?: string;
  kakaoUserId?: string;
  pushToken?: string;
  createdAt: Date;
}

export interface Guardian {
  id: string;
  elderId: string;
  name: string;
  role: GuardianRole;
  email: string;
  language: Language;
  createdAt: Date;
}

export interface Conversation {
  id: string;
  elderId: string;
  module: ConversationModule;
  question: string;
  answer?: string;
  photoUrls: string[];
  emotionTags: string[];
  weekNumber?: number;
  createdAt: Date;
}

export interface ConcernLog {
  id: string;
  elderId: string;
  level: ConcernLevel;
  reason: string;
  notified: boolean;
  createdAt: Date;
}

export interface MemoirChapter {
  title: string;
  content: string;
  quote?: string;
  photoUrl?: string;
}

export interface Memoir {
  id: string;
  elderId: string;
  month: string; // 'YYYY-MM'
  chapters: MemoirChapter[];
  pdfUrl?: string;
  sentAt?: Date;
  createdAt: Date;
  elder?: Elder;
}

export interface ElderContext {
  recentTopics: string[];
  lastConcernFlag?: ConcernLog;
  avgResponseDelay: number; // minutes
  todayResponseDelay: number;
  hoursSinceLastReply: number;
  negativeEmotionCount: number;
}

export interface ResponsePattern {
  hoursSinceLastReply: number;
  avgResponseDelay: number;
  todayResponseDelay: number;
  negativeEmotionCount: number;
}
