import ShipmentTracking from "@/components/shipment/ShipmentTracking";

// 주소의 [id] 값(배송 번호)은 params 로 들어온다 (Next.js 16 에서는 await 해서 꺼낸다)
export default async function TrackingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return <ShipmentTracking key={id} shipmentId={Number(id)} />;
}
