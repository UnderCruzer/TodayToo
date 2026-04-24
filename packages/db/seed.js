#!/usr/bin/env node
// 데모용 시드 데이터: node packages/db/seed.js
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function seed() {
  console.log('🌱 시드 데이터 삽입 시작...');

  // 어르신 2명 (일본 1 + 한국 1)
  const { data: elders, error: elderErr } = await supabase
    .from('elders')
    .insert([
      {
        name: '田中 花子',
        language: 'ja',
        timezone: 'Asia/Tokyo',
        line_user_id: 'demo-line-user-1',
      },
      {
        name: '김순희',
        language: 'ko',
        timezone: 'Asia/Seoul',
        kakao_user_id: 'demo-kakao-user-1',
      },
    ])
    .select();

  if (elderErr) { console.error('❌ Elder:', elderErr.message); process.exit(1); }
  console.log(`✅ 어르신 ${elders.length}명 생성`);

  const [jaElder, koElder] = elders;

  // 보호자 2명
  await supabase.from('guardians').insert([
    { elder_id: jaElder.id, name: '田中 一郎', role: 'family', email: 'taro@example.com', language: 'ja' },
    { elder_id: koElder.id, name: '김철수', role: 'family', email: 'chulsoo@example.com', language: 'ko' },
  ]);
  console.log('✅ 보호자 2명 생성');

  // 대화 기록 (각 5개)
  const now = new Date();
  const conversations = [];
  for (let i = 4; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);

    conversations.push(
      {
        elder_id: jaElder.id,
        module: 'daily',
        question: ['おはようございます！今日の朝ごはんは食べましたか？😊', 'お体の調子はいかがですか？', '今日は何か楽しいことがありましたか？', '最近よく眠れていますか？', '今日のお昼ごはんは何を食べましたか？😋'][i],
        answer: ['はい、ご飯とお味噌汁を食べました。', '少し腰が痛いですが元気です。', '孫が電話してくれました。嬉しかったです。', 'よく眠れています。', 'うどんを食べました。'][i],
        emotion_tags: [['喜び'], ['心配'], ['喜び', '感謝'], ['安心'], ['満足']][i],
        created_at: date.toISOString(),
      },
      {
        elder_id: koElder.id,
        module: 'daily',
        question: ['좋은 아침이에요! 오늘 아침은 드셨어요? 😊', '오늘 몸 상태는 어떠세요?', '오늘 즐거운 일 있으셨어요?', '요즘 잘 주무시나요?', '오늘 점심은 뭐 드셨어요? 😋'][i],
        answer: ['미역국에 밥 먹었어요.', '허리가 좀 아프지만 괜찮아요.', '딸이 전화했어요.', '잘 자고 있어요.', '된장찌개 먹었지요.'][i],
        emotion_tags: [['기쁨'], ['걱정'], ['기쁨', '감사'], ['안심'], ['만족']][i],
        created_at: date.toISOString(),
      }
    );
  }

  await supabase.from('conversations').insert(conversations);
  console.log('✅ 대화 기록 10개 생성');

  // 이상감지 로그 (한국 어르신 medium 1건)
  await supabase.from('concern_logs').insert([
    {
      elder_id: koElder.id,
      level: 'medium',
      reason: '최근 외로움·슬픔 표현이 많습니다',
      notified: true,
    },
  ]);
  console.log('✅ 이상감지 로그 1건 생성');

  // 회고록 1개 (일본 어르신)
  await supabase.from('memoirs').insert([
    {
      elder_id: jaElder.id,
      month: '2026-03',
      chapters: [
        {
          title: '春の思い出',
          content: '孫と桜を見に行った。あの子の笑顔がとても可愛かった。来年もまた一緒に行きたいと思う。',
          quote: '桜がこんなに綺麗だとは知らなかった',
          photoUrl: null,
        },
      ],
    },
  ]);
  console.log('✅ 회고록 1개 생성');

  console.log('\n🎉 시드 완료! http://localhost:3000/dashboard 에서 확인하세요.');
}

seed().catch(err => {
  console.error('❌ 시드 실패:', err.message);
  process.exit(1);
});
