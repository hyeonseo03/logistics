"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import ProductCard from "@/components/product/ProductCard";
import { getProducts } from "@/lib/api";
import type { ProductWithStock } from "@/types/product";

const SHOW_COUNT = 4; // 섹션마다 보여줄 상품 수

// 홈: "오늘 출고 가능한 상품" + "품절 임박 상품" (실제 상품·재고 API 로 계산)
// - 오늘 출고: 배송지에서 가까운 출고 센터가 당일 출고 센터이고 재고가 있는 상품
// - 품절 임박: 판매가능재고가 1~9개인 상품 (적게 남은 순)
export default function HomeProductSections() {
  const [products, setProducts] = useState<ProductWithStock[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    getProducts()
      .then(setProducts)
      .catch((err) => setError(err instanceof Error ? err.message : "상품을 불러오지 못했습니다."));
  }, []);

  if (error) {
    return <p className="rounded border border-red-200 bg-red-50 p-4 text-center text-red-700">{error}</p>;
  }

  const sameDay = (products ?? [])
    .filter((p) => p.sameDayShipping && p.stockStatus !== "SOLD_OUT")
    .slice(0, SHOW_COUNT);
  const lowStock = (products ?? [])
    .filter((p) => p.stockStatus === "LOW_STOCK")
    .sort((a, b) => a.totalStock - b.totalStock)
    .slice(0, SHOW_COUNT);

  return (
    <div className="flex flex-col gap-12">
      <Section
        title="오늘 출고 가능한 상품"
        description="가까운 물류센터에 재고가 있어 오늘 바로 출고돼요."
        badge="당일 출고"
        badgeColor="bg-blue-100 text-blue-700"
        products={products === null ? null : sameDay}
        emptyText="지금 당일 출고 가능한 상품이 없어요."
      />
      <Section
        title="품절 임박 상품"
        description="남은 수량이 10개도 안 돼요. 서두르세요!"
        badge="곧 품절"
        badgeColor="bg-orange-100 text-orange-700"
        products={products === null ? null : lowStock}
        emptyText="품절 임박 상품이 없어요. 재고가 넉넉해요!"
      />
    </div>
  );
}

function Section({
  title,
  description,
  badge,
  badgeColor,
  products,
  emptyText,
}: {
  title: string;
  description: string;
  badge: string;
  badgeColor: string;
  products: ProductWithStock[] | null; // null: 불러오는 중
  emptyText: string;
}) {
  return (
    <section>
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="flex items-center gap-2 text-xl font-bold">
            {title}
            <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${badgeColor}`}>{badge}</span>
          </h2>
          <p className="mt-1 text-sm text-gray-500">{description}</p>
        </div>
        <Link href="/products" className="text-sm text-blue-600 hover:underline">
          전체 상품 보기 →
        </Link>
      </div>

      {products === null ? (
        <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="aspect-[3/4] animate-pulse rounded-lg bg-gray-100" />
          ))}
        </div>
      ) : products.length === 0 ? (
        <p className="mt-4 rounded-lg border bg-white p-6 text-center text-sm text-gray-500">{emptyText}</p>
      ) : (
        <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </section>
  );
}
