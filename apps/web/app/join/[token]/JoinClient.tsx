'use client';

import { useState } from 'react';

interface Props {
  token: string;
  lineAddUrl: string | null;
}

export default function JoinClient({ token, lineAddUrl }: Props) {
  const [copied, setCopied] = useState(false);
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [form, setForm] = useState({ name: '', email: '', language: 'ja' });

  function copyToken() {
    navigator.clipboard.writeText(token).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  async function submitManual(e: React.FormEvent) {
    e.preventDefault();
    setStatus('loading');
    try {
      const res = await fetch('/api/guardian/invite', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, ...form }),
      });
      if (!res.ok) throw new Error(await res.text());
      setStatus('done');
    } catch {
      setStatus('error');
    }
  }

  if (status === 'done') {
    return (
      <div className="text-center py-12">
        <div className="text-5xl mb-4">✅</div>
        <h2 className="text-xl font-bold text-gray-800">등록 완료!</h2>
        <p className="text-gray-500 mt-2">이상감지 알림을 이메일로 받으실 수 있습니다.</p>
      </div>
    );
  }

  return (
    <>
      {/* LINE 등록 */}
      <div className="bg-green-50 border border-green-200 rounded-xl p-5 mb-6">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-2xl">📱</span>
          <h2 className="font-bold text-green-800">LINE으로 등록하기 (권장)</h2>
        </div>
        <ol className="text-sm text-green-900 space-y-2 list-decimal list-inside">
          {lineAddUrl ? (
            <li>
              <a href={lineAddUrl} className="underline font-medium" target="_blank" rel="noopener noreferrer">
                오늘도요 LINE 봇 추가하기 →
              </a>
            </li>
          ) : (
            <li>LINE에서 <strong>오늘도요</strong> 봇을 친구 추가합니다</li>
          )}
          <li>봇 채팅창에 아래 초대 코드를 복사해서 보내세요</li>
          <li>등록 완료 메시지를 받으면 완료!</li>
        </ol>
        <div className="mt-4">
          <p className="text-xs text-green-700 mb-1">초대 코드 / 招待コード</p>
          <div className="bg-white border-2 border-green-400 rounded-lg p-3 flex items-center justify-between gap-2">
            <code className="text-xs text-gray-700 break-all">{token}</code>
            <button
              onClick={copyToken}
              className="shrink-0 text-xs bg-green-500 text-white px-2 py-1 rounded"
            >
              {copied ? '복사됨!' : '복사'}
            </button>
          </div>
        </div>
      </div>

      {/* 수동 등록 */}
      <details className="border rounded-xl p-4">
        <summary className="cursor-pointer text-sm font-medium text-gray-600">
          직접 정보 입력하기 (LINE 없는 경우)
        </summary>
        <form onSubmit={submitManual} className="mt-4 space-y-3">
          <div>
            <label className="block text-xs text-gray-600 mb-1">이름 / お名前</label>
            <input
              required
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              className="w-full border rounded-lg px-3 py-2 text-sm"
              placeholder="홍길동 / 山田太郎"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">이메일</label>
            <input
              type="email"
              required
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              className="w-full border rounded-lg px-3 py-2 text-sm"
              placeholder="email@example.com"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">언어 / 言語</label>
            <select
              value={form.language}
              onChange={e => setForm(f => ({ ...f, language: e.target.value }))}
              className="w-full border rounded-lg px-3 py-2 text-sm"
            >
              <option value="ja">日本語</option>
              <option value="ko">한국어</option>
            </select>
          </div>
          {status === 'error' && (
            <p className="text-xs text-red-500">오류가 발생했습니다. 다시 시도해주세요.</p>
          )}
          <button
            type="submit"
            disabled={status === 'loading'}
            className="w-full bg-gray-700 text-white py-2 rounded-lg text-sm font-medium disabled:opacity-50"
          >
            {status === 'loading' ? '등록 중...' : '등록하기'}
          </button>
        </form>
      </details>
    </>
  );
}
