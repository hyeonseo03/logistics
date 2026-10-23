import ProductBrowser from "@/components/product/ProductBrowser";

// 상품 목록. /products?categoryId=1 처럼 들어오면 그 카테고리를 골라 둔 상태로 시작한다
// (Next.js 16 에서는 searchParams 를 await 해서 꺼낸다)
export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ categoryId?: string }>;
}) {
  const { categoryId } = await searchParams;
  const initialCategoryId = categoryId ? Number(categoryId) || undefined : undefined;

  // key: 주소의 카테고리가 바뀌면 화면 상태를 새로 시작한다
  return <ProductBrowser key={categoryId ?? "all"} initialCategoryId={initialCategoryId} />;
}
