import MyShipmentList from "@/components/shipment/MyShipmentList";

export default function MyShipmentsPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold">배송 조회</h1>
      <div className="mt-6">
        <MyShipmentList />
      </div>
    </div>
  );
}
