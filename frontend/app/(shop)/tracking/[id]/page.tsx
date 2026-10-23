import RequireLogin from "@/components/common/RequireLogin";
import ShipmentTracking from "@/components/shipment/ShipmentTracking";

// 배송 조회. 주소의 [id] 는 주문 번호다 (백엔드 GET /api/orders/{id}/tracking, 내 주문만 조회된다)
// (Next.js 16 에서는 params 를 await 해서 꺼낸다)
export default async function TrackingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <RequireLogin>
      <ShipmentTracking key={id} orderId={Number(id)} />
    </RequireLogin>
  );
}
