import { getAllElders, getRecentConcernLogs, getMemoirsByElder } from '@oneuldo/db/queries';
import ElderCard from '../components/ElderCard';
import type { ConcernLevel } from '@oneuldo/types';

export const dynamic = 'force-dynamic';

const CONCERN_OPTIONS: { label: string; value: ConcernLevel | 'all' }[] = [
  { label: '전체', value: 'all' },
  { label: '🔴 고위험', value: 'high' },
  { label: '🟡 주의', value: 'medium' },
  { label: '🟢 안정', value: 'low' },
];

export default async function Dashboard({
  searchParams,
}: {
  searchParams: Promise<{ concern?: string }>;
}) {
  const { concern } = await searchParams;
  const filterLevel = (concern ?? 'all') as ConcernLevel | 'all';
  const elders = await getAllElders();

  const eldersWithStatus = await Promise.all(
    elders.map(async elder => {
      const [logs, memoirs] = await Promise.all([
        getRecentConcernLogs(elder.id, 1),
        getMemoirsByElder(elder.id),
      ]);
      return {
        elder,
        concernLevel: logs[0]?.level ?? null,
        lastMemoirMonth: memoirs[0]?.month ?? null,
      };
    })
  );

  const filtered = filterLevel === 'all'
    ? eldersWithStatus
    : eldersWithStatus.filter(e => e.concernLevel === filterLevel);

  const counts = {
    high: eldersWithStatus.filter(e => e.concernLevel === 'high').length,
    medium: eldersWithStatus.filter(e => e.concernLevel === 'medium').length,
    low: eldersWithStatus.filter(e => e.concernLevel === 'low').length,
    none: eldersWithStatus.filter(e => !e.concernLevel).length,
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-light text-primary-500">
              今日もね / 오늘도요
            </h1>
            <p className="text-sm text-gray-400">기관 담당자 대시보드</p>
          </div>
          <span className="text-sm text-gray-400">
            {new Date().toLocaleDateString('ko-KR', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </span>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* 요약 현황 */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl p-4 text-center border border-gray-100">
            <p className="text-3xl font-bold text-gray-700">{elders.length}</p>
            <p className="text-sm text-gray-400 mt-1">전체 이용자</p>
          </div>
          <div className="bg-red-50 rounded-xl p-4 text-center border border-red-100">
            <p className="text-3xl font-bold text-red-500">{counts.high}</p>
            <p className="text-sm text-gray-400 mt-1">고위험</p>
          </div>
          <div className="bg-yellow-50 rounded-xl p-4 text-center border border-yellow-100">
            <p className="text-3xl font-bold text-yellow-500">{counts.medium}</p>
            <p className="text-sm text-gray-400 mt-1">주의</p>
          </div>
          <div className="bg-green-50 rounded-xl p-4 text-center border border-green-100">
            <p className="text-3xl font-bold text-green-500">{counts.low}</p>
            <p className="text-sm text-gray-400 mt-1">안정</p>
          </div>
        </div>

        {/* 필터 */}
        <div className="flex gap-2 mb-6">
          {CONCERN_OPTIONS.map(opt => (
            <a
              key={opt.value}
              href={opt.value === 'all' ? '/dashboard' : `/dashboard?concern=${opt.value}`}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                filterLevel === opt.value
                  ? 'bg-primary-500 text-white'
                  : 'bg-white text-gray-500 border border-gray-200 hover:border-primary-300'
              }`}
            >
              {opt.label}
              {opt.value !== 'all' && (
                <span className="ml-1 text-xs opacity-70">
                  ({opt.value === 'high' ? counts.high : opt.value === 'medium' ? counts.medium : counts.low})
                </span>
              )}
            </a>
          ))}
        </div>

        <div className="mb-4">
          <h2 className="text-base font-medium text-gray-600">
            {filterLevel === 'all' ? `전체 이용자` : `필터 결과`} ({filtered.length}명)
          </h2>
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <p className="text-5xl mb-4">🌸</p>
            <p>해당하는 이용자가 없습니다.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(({ elder, concernLevel, lastMemoirMonth }) => (
              <ElderCard
                key={elder.id}
                elder={elder}
                concernLevel={concernLevel}
                lastMemoirMonth={lastMemoirMonth}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
