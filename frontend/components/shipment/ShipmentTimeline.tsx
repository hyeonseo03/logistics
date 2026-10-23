import { shipmentStatusLabel, shipmentSteps } from "@/lib/labels";
import type { ShipmentStatus } from "@/types/shipment";

// 상품준비 → 출고 → 배송중 → 배송완료 4단계 진행 표시 (취소·회수 주문에는 쓰지 않는다)
export default function ShipmentTimeline({ status }: { status: ShipmentStatus }) {
  const currentIndex = shipmentSteps.indexOf(status);

  return (
    <ol className="flex items-start">
      {shipmentSteps.map((step, index) => {
        const done = index <= currentIndex; // 지나왔거나 현재 단계
        const isLast = index === shipmentSteps.length - 1;

        return (
          <li key={step} className="flex flex-1 flex-col items-center">
            <div className="flex w-full items-center">
              {/* 왼쪽 선 (첫 단계는 투명) */}
              <div className={`h-1 flex-1 ${index === 0 ? "invisible" : done ? "bg-blue-600" : "bg-gray-200"}`} />
              {/* 동그라미 */}
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${
                  done ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-500"
                }`}
              >
                {index + 1}
              </div>
              {/* 오른쪽 선 (마지막 단계는 투명) */}
              <div
                className={`h-1 flex-1 ${isLast ? "invisible" : index < currentIndex ? "bg-blue-600" : "bg-gray-200"}`}
              />
            </div>
            <p className={`mt-2 text-sm ${index === currentIndex ? "font-bold text-blue-600" : "text-gray-500"}`}>
              {shipmentStatusLabel[step]}
            </p>
          </li>
        );
      })}
    </ol>
  );
}
