import { redirect } from "next/navigation";

// 주문 내역은 마이페이지 > 주문 목록으로 옮겼다 (예전 주소로 들어와도 이동시킨다)
export default function OrdersPage() {
  redirect("/mypage/orders");
}
