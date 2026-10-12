import type { DailyOrderCount } from "@/types/admin";

// "2026-09-29" → "9/29"
function shortDate(date: string) {
  const [, month, day] = date.split("-");
  return `${Number(month)}/${Number(day)}`;
}

// 최근 7일 주문량 막대 차트 (라이브러리 없이 div 높이로 그린다)
// 막대에 마우스를 올리면 정확한 숫자가 보인다
export default function DailyOrdersChart({ data }: { data: DailyOrderCount[] }) {
  // 가장 큰 값을 기준으로 막대 높이(%)를 정한다. 모두 0이면 1로 나눠서 0% 가 되게 한다.
  const max = Math.max(1, ...data.map((d) => d.count));

  return (
    <div>
      <div className="flex h-48 items-end gap-2 border-b border-gray-300">
        {data.map((d) => (
          <div key={d.date} className="group relative flex h-full flex-1 flex-col justify-end">
            {/* 마우스를 올렸을 때 보이는 말풍선 */}
            <div className="pointer-events-none absolute -top-2 left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded bg-gray-900 px-2 py-1 text-xs text-white group-hover:block">
              {shortDate(d.date)} · {d.count}건
            </div>
            {/* 막대 */}
            <div
              className="rounded-t bg-blue-600 group-hover:bg-blue-700"
              style={{ height: `${(d.count / max) * 100}%` }}
            />
          </div>
        ))}
      </div>

      {/* x축 날짜 */}
      <div className="mt-2 flex gap-2">
        {data.map((d) => (
          <p key={d.date} className="flex-1 text-center text-xs text-gray-500">
            {shortDate(d.date)}
          </p>
        ))}
      </div>
    </div>
  );
}
