"use client";

import { useCallback, useEffect, useState } from "react";
import ProductForm from "@/components/admin/ProductForm";
import { useToast } from "@/components/common/Toast";
import ProductImage from "@/components/product/ProductImage";
import { createProduct, deleteProduct, getAdminProducts, getCategories, updateProduct } from "@/lib/api";
import { formatPrice } from "@/lib/format";
import type { Category, ProductRequest, ProductResponse } from "@/types/product";

const emptyProduct: ProductRequest = {
  categoryId: 0,
  name: "",
  description: "",
  price: 0,
  optionName: null,
  imageUrl: null,
};

// 상품 관리: 목록 + 등록 + 수정 + 삭제
export default function AdminProductsPage() {
  const [products, setProducts] = useState<ProductResponse[] | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadError, setLoadError] = useState("");
  const [adding, setAdding] = useState(false); // 등록 폼을 열었는지
  const [editingId, setEditingId] = useState<number | null>(null); // 수정 중인 상품
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const { showToast } = useToast();

  const reload = useCallback(async () => {
    try {
      setProducts(await getAdminProducts());
      setLoadError("");
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "상품 목록을 불러오지 못했습니다.");
    }
  }, []);

  useEffect(() => {
    Promise.all([getAdminProducts(), getCategories()])
      .then(([productList, categoryList]) => {
        setProducts(productList);
        setCategories(categoryList);
      })
      .catch((err) => setLoadError(err instanceof Error ? err.message : "상품 목록을 불러오지 못했습니다."));
  }, []);

  async function handleCreate(request: ProductRequest) {
    const created = await createProduct(request);
    showToast(`'${created.name}' 상품을 등록했습니다. 재고 관리에서 재고를 넣어 주세요.`);
    setAdding(false);
    setEditingId(created.id); // 이어서 사진을 올릴 수 있게 수정 폼을 연다
    await reload();
  }

  async function handleUpdate(productId: number, request: ProductRequest) {
    const updated = await updateProduct(productId, request);
    showToast(`'${updated.name}' 상품을 수정했습니다.`);
    await reload();
  }

  async function handleDelete(product: ProductResponse) {
    if (!window.confirm(`'${product.name}' 상품을 삭제할까요?\n장바구니·재고 정보도 함께 삭제됩니다.`)) return;
    setDeletingId(product.id);
    try {
      await deleteProduct(product.id);
      showToast(`'${product.name}' 상품을 삭제했습니다.`);
      if (editingId === product.id) setEditingId(null);
      await reload();
    } catch (err) {
      // 주문된 적 있는 상품이면 409 "주문 이력이 있는 상품은 삭제할 수 없습니다."
      showToast(err instanceof Error ? err.message : "삭제하지 못했습니다.", "error");
    } finally {
      setDeletingId(null);
    }
  }

  const editing = products?.find((p) => p.id === editingId) ?? null;

  return (
    <div className="p-4 sm:p-8">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-bold">상품 관리</h1>
        {!adding && (
          <button
            type="button"
            onClick={() => {
              setEditingId(null);
              setAdding(true);
            }}
            className="rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
          >
            + 상품 등록
          </button>
        )}
      </div>

      {adding && (
        <section className="mt-6">
          <h2 className="mb-2 font-semibold">새 상품 등록</h2>
          <ProductForm
            categories={categories}
            initial={{ ...emptyProduct, categoryId: categories[0]?.id ?? 0 }}
            submitLabel="등록"
            onSubmit={handleCreate}
            onCancel={() => setAdding(false)}
          />
        </section>
      )}

      {editing && (
        <section className="mt-6">
          <h2 className="mb-2 font-semibold">상품 수정 · {editing.name}</h2>
          <ProductForm
            key={editing.id}
            categories={categories}
            initial={{
              categoryId: editing.categoryId,
              name: editing.name,
              description: editing.description,
              price: editing.price,
              optionName: editing.optionName,
              imageUrl: editing.imageUrl,
            }}
            submitLabel="수정 저장"
            onSubmit={(request) => handleUpdate(editing.id, request)}
            onCancel={() => setEditingId(null)}
          />
        </section>
      )}

      {loadError && <p className="mt-6 rounded border border-red-200 bg-red-50 p-4 text-red-700">{loadError}</p>}

      {!products ? (
        !loadError && <p className="mt-10 text-gray-500">불러오는 중...</p>
      ) : (
        <div className="mt-6 overflow-x-auto rounded border bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-100 text-gray-600">
              <tr>
                <th className="px-4 py-3">사진</th>
                <th className="px-4 py-3">상품</th>
                <th className="px-4 py-3">카테고리</th>
                <th className="px-4 py-3 text-right">가격</th>
                <th className="px-4 py-3 text-right">판매가능재고</th>
                <th className="px-4 py-3">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {products.map((product) => (
                <tr key={product.id} className={editingId === product.id ? "bg-blue-50" : ""}>
                  <td className="px-4 py-2">
                    <div className="w-12">
                      <ProductImage
                        imageUrl={product.imageUrl}
                        name={product.name}
                        categoryName={product.categoryName}
                        size="small"
                      />
                    </div>
                  </td>
                  <td className="px-4 py-2">
                    <p className="font-medium">{product.name}</p>
                    {product.optionName && <p className="text-xs text-gray-500">{product.optionName}</p>}
                  </td>
                  <td className="px-4 py-2 text-gray-600">{product.categoryName}</td>
                  <td className="whitespace-nowrap px-4 py-2 text-right">{formatPrice(product.price)}</td>
                  <td className={`px-4 py-2 text-right ${product.totalStock === 0 ? "font-semibold text-red-600" : ""}`}>
                    {product.totalStock === 0 ? "품절" : `${product.totalStock}개`}
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setAdding(false);
                          setEditingId(product.id);
                          window.scrollTo({ top: 0, behavior: "smooth" });
                        }}
                        className="whitespace-nowrap rounded border px-2 py-1 hover:bg-gray-50"
                      >
                        수정
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(product)}
                        disabled={deletingId === product.id}
                        className="whitespace-nowrap rounded border border-red-300 px-2 py-1 text-red-600 hover:bg-red-50 disabled:opacity-50"
                      >
                        {deletingId === product.id ? "삭제 중..." : "삭제"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
