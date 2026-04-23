import { getAllElders, getRecentConcernLogs, getMemoirsByElder } from '@oneuldo/db/queries';
import ElderCard from '../components/ElderCard';

export const dynamic = 'force-dynamic';

export default async function Dashboard() {
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <header className="bg-white border-b border-gray-100 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-light text-primary-500">
              今日もね / 오늘도요
            </h1>
            <p className="text-sm text-gray-400">가족·기관 대시보드</p>
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
        <div className="mb-6">
          <h2 className="text-lg font-medium text-gray-700">
            담당 어르신 ({elders.length}명)
          </h2>
        </div>

        {elders.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <p className="text-5xl mb-4">🌸</p>
            <p>아직 연결된 어르신이 없습니다.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {eldersWithStatus.map(({ elder, concernLevel, lastMemoirMonth }) => (
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
