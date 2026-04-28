'use client';

import { useState } from 'react';

export default function InviteSection({ elderId, isJa }: { elderId: string; isJa: boolean }) {
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  async function generate() {
    setLoading(true);
    try {
      const res = await fetch('/api/guardian/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ elderId }),
      });
      const data = await res.json() as { inviteUrl: string };
      setUrl(data.inviteUrl);
    } finally {
      setLoading(false);
    }
  }

  function copy() {
    if (!url) return;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div>
      <h2 className="font-medium text-gray-700 mb-3">
        {isJa ? '保護者招待' : '보호자 초대'}
      </h2>
      {!url ? (
        <button
          onClick={generate}
          disabled={loading}
          className="w-full bg-green-500 text-white rounded-lg py-2 text-sm font-medium disabled:opacity-50"
        >
          {loading
            ? (isJa ? '生成中...' : '생성 중...')
            : (isJa ? '招待リンク生成' : '초대 링크 생성')}
        </button>
      ) : (
        <div className="bg-green-50 border border-green-200 rounded-xl p-3">
          <p className="text-xs text-green-700 mb-2">
            {isJa ? '保護者にこのリンクを送ってください（7日間有効）' : '보호자에게 이 링크를 보내주세요 (7일 유효)'}
          </p>
          <div className="flex gap-2">
            <code className="text-xs bg-white rounded p-2 flex-1 break-all border border-green-200">
              {url}
            </code>
            <button
              onClick={copy}
              className="shrink-0 text-xs bg-green-500 text-white px-3 rounded"
            >
              {copied ? '✓' : (isJa ? 'コピー' : '복사')}
            </button>
          </div>
          <button
            onClick={() => { setUrl(null); }}
            className="text-xs text-green-600 underline mt-2"
          >
            {isJa ? '新しいリンクを生成' : '새 링크 생성'}
          </button>
        </div>
      )}
    </div>
  );
}
