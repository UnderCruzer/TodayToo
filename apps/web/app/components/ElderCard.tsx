import Link from 'next/link';
import type { Elder, ConcernLevel } from '@oneuldo/types';

interface Props {
  elder: Elder;
  concernLevel: ConcernLevel | null;
  lastMemoirMonth: string | null;
}

const STATUS_CONFIG = {
  null: {
    label: '정상',
    labelJa: '正常',
    color: 'bg-green-100 text-green-700',
    dot: 'bg-green-400',
  },
  low: {
    label: '관심',
    labelJa: '注意',
    color: 'bg-yellow-100 text-yellow-700',
    dot: 'bg-yellow-400',
  },
  medium: {
    label: '주의',
    labelJa: '心配',
    color: 'bg-orange-100 text-orange-700',
    dot: 'bg-orange-400',
  },
  high: {
    label: '긴급',
    labelJa: '緊急',
    color: 'bg-red-100 text-red-700',
    dot: 'bg-red-500',
  },
} as const;

export default function ElderCard({ elder, concernLevel, lastMemoirMonth }: Props) {
  const key = concernLevel ?? 'null';
  const status = STATUS_CONFIG[key as keyof typeof STATUS_CONFIG];
  const isJa = elder.language === 'ja';

  return (
    <Link href={`/elder/${elder.id}`}>
      <div className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-md transition-shadow duration-200 cursor-pointer">
        {/* 이름 + 상태 */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-medium text-gray-800">
              {elder.name}
              {isJa ? 'さん' : '님'}
            </h3>
            <p className="text-sm text-gray-400 mt-0.5">
              {isJa ? '日本語' : '한국어'} ·{' '}
              {elder.timezone === 'Asia/Tokyo' ? '東京' : '서울'}
            </p>
          </div>
          <span
            className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${status.color}`}
          >
            <span className={`w-2 h-2 rounded-full ${status.dot}`} />
            {isJa ? status.labelJa : status.label}
          </span>
        </div>

        {/* 회고록 정보 */}
        <div className="border-t border-gray-50 pt-3 mt-3">
          <p className="text-sm text-gray-400">
            {lastMemoirMonth
              ? (isJa
                  ? `最近の物語: ${lastMemoirMonth}`
                  : `최근 이야기: ${lastMemoirMonth}`)
              : (isJa ? '物語まだなし' : '이야기 아직 없음')}
          </p>
        </div>
      </div>
    </Link>
  );
}
