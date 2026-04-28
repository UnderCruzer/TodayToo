import { notFound } from 'next/navigation';
import { supabase } from '@oneuldo/db';
import JoinClient from './JoinClient';

interface Props {
  params: Promise<{ token: string }>;
}

async function validateToken(token: string): Promise<boolean> {
  const { data } = await supabase
    .from('invite_tokens')
    .select('id')
    .eq('token', token)
    .eq('used', false)
    .gt('expires_at', new Date().toISOString())
    .maybeSingle();
  return !!data;
}

export default async function JoinPage({ params }: Props) {
  const { token } = await params;
  const valid = await validateToken(token);
  if (!valid) notFound();

  const lineBotId = process.env.LINE_BOT_BASIC_ID ?? '';
  const lineAddUrl = lineBotId ? `https://line.me/R/ti/p/${lineBotId}` : null;

  return (
    <main className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg max-w-md w-full p-8">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">👨‍👩‍👧</div>
          <h1 className="text-2xl font-bold text-gray-800">오늘도요 보호자 등록</h1>
          <p className="text-gray-500 mt-1 text-sm">今日もね 保護者登録</p>
        </div>
        <JoinClient token={token} lineAddUrl={lineAddUrl} />
      </div>
    </main>
  );
}
