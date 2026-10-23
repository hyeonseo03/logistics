"use client";

import { useEffect, useState } from "react";
import FilterButton from "@/components/common/FilterButton";
import ProductCard from "@/components/product/ProductCard";
import { getCategories, getProducts } from "@/lib/api";
import type { Category, ProductSort, ProductWithStock } from "@/types/product";

const sortOptions: { value: ProductSort; label: string }[] = [
  { value: "NEWEST", label: "최신순" },
  { value: "PRICE_ASC", label: "낮은 가격순" },
  { value: "PRICE_DESC", label: "높은 가격순" },
  { value: "NAME", label: "이름순" },
];

// 상품 목록 화면 (검색 + 카테고리 필터 + 정렬)
// initialCategoryId: 홈의 카테고리 바로가기처럼 주소(?categoryId=)로 카테고리를 정해서 들어온 경우
export default function ProductBrowser({ initialCategoryId }: { initialCategoryId?: number }) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<ProductWithStock[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(""); // 상품을 못 불러왔을 때 보여줄 안내 (예: 백엔드 서버가 꺼져 있음)

  // 검색 조건
  const [keywordInput, setKeywordInput] = useState(""); // 입력창에 쓰고 있는 글자
  const [keyword, setKeyword] = useState(""); // 검색 버튼을 눌러서 실제로 적용된 검색어
  const [categoryId, setCategoryId] = useState<number | undefined>(initialCategoryId);
  const [sort, setSort] = useState<ProductSort>("NEWEST");

  // 카테고리 목록은 처음 한 번만 불러온다
  useEffect(() => {
    getCategories()
      .then(setCategories)
      .catch(() => setCategories([])); // 카테고리를 못 불러와도 상품 목록 에러 안내가 함께 보인다
  }, []);

  // 검색 조건이 바뀔 때마다 상품 목록을 다시 불러온다
  useEffect(() => {
    // 조건을 빠르게 여러 번 바꾸면 예전 요청의 결과가 늦게 도착할 수 있다.
    // 그런 오래된 결과는 무시하기 위한 표시.
    let ignore = false;

    getProducts({ keyword, categoryId, sort })
      .then((data) => {
        if (!ignore) {
          setProducts(data);
          setError("");
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!ignore) {
          setError(err instanceof Error ? err.message : "상품을 불러오지 못했습니다.");
          setLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, [keyword, categoryId, sort]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault(); // form 제출 시 페이지가 새로고침되지 않게
    const next = keywordInput.trim();
    if (next === keyword) return;
    setLoading(true);
    setKeyword(next);
  }

  function handleCategory(id: number | undefined) {
    if (id === categoryId) return;
    setLoading(true);
    setCategoryId(id);
  }

  function handleSort(value: ProductSort) {
    setLoading(true);
    setSort(value);
  }

  return (
    <div className="p-4 sm:p-8">
      <h1 className="text-2xl font-bold">상품 목록</h1>

      {/* 검색창 */}
      <form onSubmit={handleSearch} className="mt-6 flex gap-2">
        <input
          value={keywordInput}
          onChange={(e) => setKeywordInput(e.target.value)}
          placeholder="상품 이름으로 검색"
          className="flex-1 rounded border px-3 py-2"
        />
        <button type="submit" className="rounded bg-blue-600 px-4 py-2 text-white">
          검색
        </button>
      </form>

      {/* 카테고리 필터 + 정렬 */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap gap-2">
          <FilterButton label="전체" active={categoryId === undefined} onClick={() => handleCategory(undefined)} />
          {categories.map((category) => (
            <FilterButton
              key={category.id}
              label={category.name}
              active={categoryId === category.id}
              onClick={() => handleCategory(category.id)}
            />
          ))}
        </div>

        <select
          value={sort}
          onChange={(e) => handleSort(e.target.value as ProductSort)}
          className="rounded border px-3 py-2"
        >
          {sortOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {/* 상품 목록 */}
      {loading ? (
        <p className="mt-10 text-center text-gray-500">불러오는 중...</p>
      ) : error ? (
        <p className="mt-10 rounded border border-red-200 bg-red-50 p-4 text-center text-red-700">{error}</p>
      ) : products.length === 0 ? (
        <p className="mt-10 text-center text-gray-500">조건에 맞는 상품이 없습니다.</p>
      ) : (
        <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
