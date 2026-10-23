// [이전] 2 / 5 [다음] 모양의 페이지 이동 버튼 (page 는 0부터 시작)
export default function Pagination({
  page,
  totalPages,
  onChange,
}: {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
}) {
  if (totalPages <= 1) return null;

  return (
    <div className="mt-4 flex items-center justify-center gap-3 text-sm">
      <button
        type="button"
        onClick={() => onChange(page - 1)}
        disabled={page === 0}
        className="rounded border bg-white px-3 py-1 hover:bg-gray-50 disabled:text-gray-300"
      >
        이전
      </button>
      <span>
        {page + 1} / {totalPages}
      </span>
      <button
        type="button"
        onClick={() => onChange(page + 1)}
        disabled={page >= totalPages - 1}
        className="rounded border bg-white px-3 py-1 hover:bg-gray-50 disabled:text-gray-300"
      >
        다음
      </button>
    </div>
  );
}
