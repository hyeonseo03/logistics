"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import CategoryIcon, { getCategoryStyle } from "@/components/product/CategoryIcon";
import { getCategories } from "@/lib/api";
import type { Category } from "@/types/product";

// 홈: 카테고리 바로가기 4개 (누르면 그 카테고리를 골라 둔 상품 목록으로)
export default function HomeCategories() {
  const [categories, setCategories] = useState<Category[] | null>(null);

  useEffect(() => {
    getCategories()
      .then(setCategories)
      .catch(() => setCategories([]));
  }, []);

  if (categories === null) {
    // 불러오는 동안 같은 크기의 빈 카드를 보여준다 (화면이 덜컹거리지 않게)
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        {[1, 2, 3, 4].map((n) => (
          <div key={n} className="h-28 animate-pulse rounded-xl bg-gray-100" />
        ))}
      </div>
    );
  }

  if (categories.length === 0) {
    return (
      <Link href="/products" className="text-blue-600 underline">
        전체 상품 보기
      </Link>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
      {categories.map((category) => {
        const style = getCategoryStyle(category.name);
        return (
          <Link
            key={category.id}
            href={`/products?categoryId=${category.id}`}
            className={`group flex h-28 flex-col items-center justify-center gap-2 rounded-xl ${style.background} ${style.color} transition hover:-translate-y-0.5 hover:shadow-md`}
          >
            <CategoryIcon categoryName={category.name} className="h-10 w-10 transition group-hover:scale-110" />
            <span className="font-semibold">{category.name}</span>
          </Link>
        );
      })}
    </div>
  );
}
