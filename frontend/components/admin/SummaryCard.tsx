// 대시보드 상단 요약 카드 하나
// warning 이 true 이고 값이 0 보다 크면 빨간색으로 강조한다 (주의가 필요한 숫자)
// value 가 null 이면 값을 불러오지 못한 것이므로 errorText 를 보여준다
export default function SummaryCard({
  label,
  value,
  unit,
  warning = false,
  errorText = "불러올 수 없습니다",
}: {
  label: string;
  value: number | null;
  unit: string;
  warning?: boolean;
  errorText?: string;
}) {
  const highlight = warning && value !== null && value > 0;

  return (
    <div className={`rounded-lg border bg-white p-5 ${highlight ? "border-red-300" : ""}`}>
      <p className="text-sm text-gray-500">
        {label}
        {highlight && <span className="ml-2 text-xs font-semibold text-red-600">⚠ 확인 필요</span>}
      </p>
      {value === null ? (
        <p className="mt-2 text-sm text-gray-500">{errorText}</p>
      ) : (
        <p className={`mt-2 text-3xl font-bold ${highlight ? "text-red-600" : ""}`}>
          {value}
          <span className="ml-1 text-base font-normal text-gray-500">{unit}</span>
        </p>
      )}
    </div>
  );
}
