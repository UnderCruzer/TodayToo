'use client';

interface Props {
  label: string;
}

export default function PrintButton({ label }: Props) {
  return (
    <button
      onClick={() => window.print()}
      className="print:hidden fixed bottom-6 right-6
        bg-primary-500 hover:bg-primary-600 active:bg-primary-700
        text-white px-6 py-3 rounded-full shadow-lg
        transition-colors duration-150 text-base font-medium"
    >
      {label}
    </button>
  );
}
