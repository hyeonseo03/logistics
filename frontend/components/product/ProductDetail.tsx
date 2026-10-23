"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/common/AuthContext";
import QuantitySelector from "@/components/common/QuantitySelector";
import { useCart } from "@/components/order/CartContext";
import ProductImage from "@/components/product/ProductImage";
import StockBadge from "@/components/product/StockBadge";
import { getProduct, requestRestockAlert } from "@/lib/api";
import { formatArrival, formatPrice } from "@/lib/format";
import type { ProductWithStock } from "@/types/product";

export default function ProductDetail({ productId }: { productId: number }) {
  const [product, setProduct] = useState<ProductWithStock | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(""); // 상품을 못 불러왔을 때 보여줄 안내 (예: 백엔드 서버가 꺼져 있음)
  const [quantity, setQuantity] = useState(1);
  const [cartMessage, setCartMessage] = useState(""); // 장바구니 담기 결과 안내
  const [cartError, setCartError] = useState(false);
  const [adding, setAdding] = useState(false);
  const [alertMessage, setAlertMessage] = useState(""); // 재입고 알림 신청 결과 안내
  const [alertLoading, setAlertLoading] = useState(false);
  const { user } = useAuth();
  const { addItem } = useCart();
  const router = useRouter();

  useEffect(() => {
    getProduct(productId)
      .then((data) => {
        setProduct(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "상품을 불러오지 못했습니다.");
        setLoading(false);
      });
  }, [productId]);

  if (loading) {
    return <p className="p-8 text-gray-500">불러오는 중...</p>;
  }

  if (error) {
    return (
      <div className="p-8">
        <p className="rounded border border-red-200 bg-red-50 p-4 text-red-700">{error}</p>
        <Link href="/products" className="mt-4 inline-block text-blue-600 underline">
          상품 목록으로
        </Link>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="p-8">
        <p>상품을 찾을 수 없습니다.</p>
        <Link href="/products" className="mt-4 inline-block text-blue-600 underline">
          상품 목록으로
        </Link>
      </div>
    );
  }

  const soldOut = product.stockStatus === "SOLD_OUT";

  // 로그인하지 않았으면 로그인 화면으로 보냈다가, 로그인 후 이 상품으로 돌아온다
  function goLogin() {
    router.push(`/login?redirect=${encodeURIComponent(`/products/${productId}`)}`);
  }

  async function handleAddToCart() {
    if (!user) return goLogin();
    setAdding(true);
    try {
      await addItem(productId, quantity);
      setCartError(false);
      setCartMessage("장바구니에 담았습니다.");
    } catch (err) {
      setCartError(true);
      setCartMessage(err instanceof Error ? err.message : "장바구니에 담지 못했습니다.");
    } finally {
      setAdding(false);
    }
  }

  async function handleRestockAlert() {
    if (!user) return goLogin();
    setAlertLoading(true);
    try {
      await requestRestockAlert(productId);
      setAlertMessage("재입고되면 알려드릴게요. (마이페이지 > 재입고 알림 목록)");
    } catch (err) {
      setAlertMessage(err instanceof Error ? err.message : "알림 신청에 실패했습니다.");
    }
    setAlertLoading(false);
  }

  return (
    <div className="grid gap-8 p-4 sm:p-8 md:grid-cols-2">
      <ProductImage
        imageUrl={product.imageUrl}
        name={product.name}
        categoryName={product.categoryName}
        size="large"
        className="rounded-lg"
      />

      <div>
        <p className="text-sm text-gray-500">{product.categoryName}</p>
        <h1 className="mt-1 text-2xl font-bold">{product.name}</h1>
        {product.optionName && <p className="mt-1 text-sm text-gray-500">옵션: {product.optionName}</p>}
        <p className="mt-2 text-2xl font-bold">{formatPrice(product.price)}</p>
        <p className="mt-4 text-gray-700">{product.description}</p>

        {/* 재고 상태 + 예상 도착일 */}
        <div className="mt-6 rounded border bg-gray-50 p-4 text-sm">
          <div className="flex flex-wrap items-center gap-2">
            <StockBadge status={product.stockStatus} quantity={product.totalStock} />
            {product.sameDayShipping && (
              <span className="rounded bg-blue-100 px-2 py-0.5 text-blue-700">당일 출고</span>
            )}
          </div>

          {product.estimatedArrivalDate ? (
            <p className="mt-3 text-base font-semibold text-blue-700">
              {formatArrival(product.estimatedArrivalDate)}
            </p>
          ) : (
            <p className="mt-3 text-gray-600">현재 품절된 상품입니다.</p>
          )}
        </div>

        {/* 수량 선택 + 장바구니 담기 (품절이면 버튼 비활성화 + 재입고 알림 신청) */}
        {soldOut ? (
          <div className="mt-6">
            <div className="flex flex-wrap gap-2">
              <button type="button" disabled className="cursor-not-allowed rounded bg-gray-300 px-6 py-2 text-white">
                품절
              </button>
              <button
                type="button"
                onClick={handleRestockAlert}
                disabled={alertLoading}
                className="rounded border border-blue-600 px-6 py-2 text-blue-600 hover:bg-blue-50 disabled:opacity-50"
              >
                {alertLoading ? "신청 중..." : "재입고 알림 신청"}
              </button>
            </div>
            {alertMessage && <p className="mt-3 text-sm text-gray-700">{alertMessage}</p>}
          </div>
        ) : (
          <div className="mt-6 flex flex-wrap items-center gap-4">
            <QuantitySelector
              value={quantity}
              max={Math.min(product.totalStock, 99)}
              onChange={(value) => {
                setQuantity(value);
                setCartMessage("");
              }}
            />
            <button
              type="button"
              onClick={handleAddToCart}
              disabled={adding}
              className="rounded bg-blue-600 px-6 py-2 text-white hover:bg-blue-700 disabled:bg-gray-400"
            >
              {adding ? "담는 중..." : "장바구니 담기"}
            </button>
          </div>
        )}

        {cartMessage && (
          <p className={`mt-4 text-sm ${cartError ? "text-red-600" : "text-green-700"}`}>
            {cartMessage}{" "}
            {!cartError && (
              <Link href="/cart" className="underline">
                장바구니 보기
              </Link>
            )}
          </p>
        )}
      </div>
    </div>
  );
}
