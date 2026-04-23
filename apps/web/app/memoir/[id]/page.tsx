import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getMemoirById } from '@oneuldo/db/queries';
import PrintButton from './PrintButton';
import type { MemoirChapter } from '@oneuldo/types';

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const memoir = await getMemoirById(id);
  if (!memoir) return { title: '회고록 | 오늘도요' };

  const title =
    memoir.elder.language === 'ja'
      ? `${memoir.elder.name}さんの物語 — ${memoir.month}`
      : `${memoir.elder.name}님의 이야기 — ${memoir.month}`;

  return { title };
}

export default async function MemoirViewer({ params }: Props) {
  const { id } = await params;
  const memoir = await getMemoirById(id);

  if (!memoir) notFound();

  const { elder, month, chapters } = memoir;
  const isJa = elder.language === 'ja';
  const chapters_ = chapters as MemoirChapter[];

  return (
    <div className="max-w-2xl mx-auto p-8 font-serif print:p-0 print:max-w-none">
      {/* 표지 */}
      <div className="text-center mb-16 pb-16 border-b border-gray-100 print:page-break-after-always">
        <div className="mb-8 text-primary-500 text-4xl">✦</div>
        <h1 className="text-4xl font-light text-gray-700 mb-4 leading-tight">
          {isJa ? `${elder.name}さんの物語` : `${elder.name}님의 이야기`}
        </h1>
        <p className="text-gray-400 text-lg">
          {month} · {isJa ? '今日もね' : '오늘도요'}
        </p>
      </div>

      {/* 챕터 목록 */}
      {chapters_.map((chapter, i) => (
        <article
          key={i}
          className="mb-14 print:mb-10 print:page-break-inside-avoid"
        >
          <h2 className="text-2xl font-light text-gray-600 border-b border-gray-100 pb-3 mb-6">
            {chapter.title}
          </h2>

          <div className="text-gray-700 leading-relaxed text-lg whitespace-pre-wrap">
            {chapter.content}
          </div>

          {chapter.photoUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={chapter.photoUrl}
              alt={chapter.title}
              className="mt-6 rounded-xl max-w-sm w-full mx-auto shadow-sm block"
            />
          )}

          {chapter.quote && (
            <blockquote className="mt-6 pl-6 border-l-2 border-primary-100 text-gray-500 italic text-lg">
              {isJa ? `「${chapter.quote}」` : `"${chapter.quote}"`}
            </blockquote>
          )}
        </article>
      ))}

      {/* 마지막 페이지 — 마무리 문구 */}
      <footer className="mt-16 text-center text-gray-300 text-sm print:mt-8">
        {isJa
          ? `${elder.name}さんの大切な物語を、いつまでも。`
          : `${elder.name}님의 소중한 이야기를, 언제까지나.`}
        <br />
        <span className="text-primary-500 opacity-50">今日もね / 오늘도요</span>
      </footer>

      {/* PDF 저장 버튼 — 인쇄 시 숨김 */}
      <PrintButton label={isJa ? 'PDFで保存' : 'PDF로 저장'} />
    </div>
  );
}
