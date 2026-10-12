import ProductDetail from "@/components/product/ProductDetail";

// 주소의 [id] 값은 params 로 들어온다 (Next.js 16 에서는 await 해서 꺼낸다)
export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // 실제 화면은 장바구니(클라이언트 상태)를 써야 해서 클라이언트 컴포넌트로 분리했다
  // key 를 주면 다른 상품으로 이동할 때 화면 상태(수량 등)가 새로 시작된다
  return <ProductDetail key={id} productId={Number(id)} />;
}
