import { notFound } from 'next/navigation';
import Link from 'next/link';
import {
  getElderById,
  getRecentConversations,
  getRecentConcernLogs,
  getMemoirsByElder,
} from '@oneuldo/db/queries';
import InviteSection from './InviteSection';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ElderDetail({ params }: Props) {
  const { id } = await params;

  const [elder, conversations, concerns, memoirs] = await Promise.all([
    getElderById(id).catch(() => null),
    getRecentConversations(id, 20),
    getRecentConcernLogs(id, 14),
    getMemoirsByElder(id),
  ]);

  if (!elder) notFound();

  const isJa = elder.language === 'ja';

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center gap-4">
          <Link href="/dashboard" className="text-gray-400 hover:text-gray-600 text-sm">
            ← {isJa ? 'ダッシュボード' : '대시보드'}
          </Link>
          <h1 className="text-xl font-light text-gray-700">
            {elder.name}{isJa ? 'さん' : '님'}
          </h1>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 왼쪽: 대화 타임라인 */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="font-medium text-gray-700 mb-4">
            {isJa ? '最近の会話' : '최근 대화'}
          </h2>
          {conversations.length === 0 ? (
            <p className="text-gray-400 text-sm">
              {isJa ? '会話がまだありません' : '대화가 아직 없습니다'}
            </p>
          ) : (
            conversations.map(conv => (
              <div key={conv.id} className="bg-white rounded-xl border border-gray-100 p-4">
                <p className="text-xs text-gray-400 mb-2">
                  {new Date(conv.createdAt).toLocaleString(
                    isJa ? 'ja-JP' : 'ko-KR'
                  )}
                  {' · '}
                  <span className="text-primary-500">{conv.module}</span>
                </p>
                <p className="text-sm text-primary-600 font-medium mb-1">
                  {conv.question}
                </p>
                {conv.answer && (
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {conv.answer}
                  </p>
                )}
                {(conv.emotionTags as string[]).length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {(conv.emotionTags as string[]).map(tag => (
                      <span
                        key={tag}
                        className="text-xs bg-primary-50 text-primary-600 px-2 py-0.5 rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* 오른쪽: 이상감지 + 회고록 */}
        <div className="space-y-6">
          {/* 이상감지 로그 */}
          <div>
            <h2 className="font-medium text-gray-700 mb-3">
              {isJa ? '異常検知ログ' : '이상감지 로그'}
            </h2>
            {concerns.length === 0 ? (
              <p className="text-sm text-gray-400">
                {isJa ? '問題なし ✓' : '이상 없음 ✓'}
              </p>
            ) : (
              <div className="space-y-2">
                {concerns.map(log => (
                  <div
                    key={log.id}
                    className={`rounded-lg p-3 text-sm ${
                      log.level === 'high'
                        ? 'bg-red-50 text-red-700'
                        : log.level === 'medium'
                        ? 'bg-orange-50 text-orange-700'
                        : 'bg-yellow-50 text-yellow-700'
                    }`}
                  >
                    <p className="font-medium">{log.level.toUpperCase()}</p>
                    <p className="text-xs mt-0.5">{log.reason}</p>
                    <p className="text-xs opacity-60 mt-1">
                      {new Date(log.createdAt).toLocaleDateString(
                        isJa ? 'ja-JP' : 'ko-KR'
                      )}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 보호자 초대 */}
          <InviteSection elderId={elder.id} isJa={isJa} />

          {/* 회고록 목록 */}
          <div>
            <h2 className="font-medium text-gray-700 mb-3">
              {isJa ? '物語' : '회고록'}
            </h2>
            {memoirs.length === 0 ? (
              <p className="text-sm text-gray-400">
                {isJa ? 'まだ物語がありません' : '아직 회고록이 없습니다'}
              </p>
            ) : (
              <div className="space-y-2">
                {memoirs.map(memoir => (
                  <Link key={memoir.id} href={`/memoir/${memoir.id}`}>
                    <div className="bg-white rounded-xl border border-gray-100 p-4 hover:shadow-sm transition-shadow cursor-pointer">
                      <p className="text-sm font-medium text-gray-700">
                        {memoir.month}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {(memoir.chapters as Array<{ title: string }>).length}
                        {isJa ? '章' : '챕터'}
                      </p>
                      <p className="text-xs text-primary-500 mt-1">
                        {isJa ? '読む →' : '읽기 →'}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
