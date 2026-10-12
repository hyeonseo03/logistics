import OrderList from "@/components/order/OrderList";

export default function MyOrdersPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold">주문 목록</h1>
      <div className="mt-6">
        <OrderList />
      </div>
    </div>
  );
}
