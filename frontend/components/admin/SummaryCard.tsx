// 대시보드 상단 요약 카드 하나
// warning 이 true 이고 값이 0 보다 크면 빨간색으로 강조한다 (주의가 필요한 숫자)
// format 이 true 면 12,000 처럼 천 단위 쉼표를 넣는다 (금액)
export default function SummaryCard({
  label,
  value,
  unit,
  warning = false,
  format = false,
}: {
  label: string;
  value: number;
  unit: string;
  warning?: boolean;
  format?: boolean;
}) {
  const highlight = warning && value > 0;

  return (
    <div className={`rounded-lg border bg-white p-4 sm:p-5 ${highlight ? "border-red-300" : ""}`}>
      <p className="text-sm text-gray-500">
        {label}
        {highlight && <span className="ml-2 text-xs font-semibold text-red-600">⚠ 확인 필요</span>}
      </p>
      <p className={`mt-2 text-2xl font-bold sm:text-3xl ${highlight ? "text-red-600" : ""}`}>
        {format ? value.toLocaleString("ko-KR") : value}
        <span className="ml-1 text-base font-normal text-gray-500">{unit}</span>
      </p>
    </div>
  );
}
