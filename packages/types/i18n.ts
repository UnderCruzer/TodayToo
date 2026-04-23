export const i18n = {
  ja: {
    appName: '今日もね',
    greeting: (name: string) => `${name}さん、おはようございます！`,
    memoirTitle: (name: string) => `${name}さんの物語`,
    concernLow: 'いつもより返信が遅れています',
    concernMedium: '最近、寂しさを多く表現されています',
    concernHigh: '緊急：連絡が取れていません',
    memoirNotify: (name: string, month: string, summary: string) =>
      `📖 ${name}さんの${month}の物語ができました。\n\n「${summary}」\n\nリンクから読んでみてください。`,
  },
  ko: {
    appName: '오늘도요',
    greeting: (name: string) => `${name}님, 좋은 아침이에요!`,
    memoirTitle: (name: string) => `${name}님의 이야기`,
    concernLow: '평소보다 응답이 늦습니다',
    concernMedium: '최근 외로움을 많이 표현하세요',
    concernHigh: '긴급: 연락이 닿지 않습니다',
    memoirNotify: (name: string, month: string, summary: string) =>
      `📖 ${name}님의 ${month} 이야기가 완성됐어요.\n\n"${summary}"\n\n링크에서 읽어보세요.`,
  },
} as const;
