"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/common/AuthContext";
import LoginRequired from "@/components/common/LoginRequired";
import { useCart } from "@/components/order/CartContext";
import { createOrder, getMyAddresses } from "@/lib/api";
import { formatPrice } from "@/lib/format";
import { getShippingFee } from "@/lib/price";
import type { Order, PaymentMethod } from "@/types/order";
import type { Address, User } from "@/types/user";

export default function CheckoutPage() {
  const { user, loading } = useAuth();

  if (loading) return <p className="p-8 text-gray-500">불러오는 중...</p>;
  if (!user) return <LoginRequired title="주문/결제" />;

  return <CheckoutLoader user={user} />;
}

// 기본 배송지를 불러온 뒤 주문서를 보여준다 (주문서 입력칸을 기본 배송지로 미리 채우기 위해)
function CheckoutLoader({ user }: { user: User }) {
  const [defaultAddress, setDefaultAddress] = useState<Address | null | undefined>(undefined); // undefined: 불러오는 중

  useEffect(() => {
    getMyAddresses().then((list) => {
      setDefaultAddress(list.find((a) => a.isDefault) ?? null);
    });
  }, []);

  if (defaultAddress === undefined) return <p className="p-8 text-gray-500">불러오는 중...</p>;
  return <CheckoutForm user={user} defaultAddress={defaultAddress} />;
}

function CheckoutForm({ user, defaultAddress }: { user: User; defaultAddress: Address | null }) {
  // 장바구니에서 체크했고 품절이 아닌 상품만 주문한다
  const { checkoutItems: items, checkoutPrice, removeItems } = useCart();
  const shippingFee = getShippingFee(checkoutPrice);
  const totalPrice = checkoutPrice + shippingFee;

  // 배송 정보 입력값 (기본 배송지로 미리 채운다. 배송지가 없으면 회원 정보로)
  const [receiverName, setReceiverName] = useState(defaultAddress?.receiverName ?? user.name);
  const [receiverPhone, setReceiverPhone] = useState(defaultAddress?.receiverPhone ?? user.phone);
  const [address, setAddress] = useState(defaultAddress?.address ?? "");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("CARD");

  const [submitting, setSubmitting] = useState(false); // 주문 요청 중인지
  const [error, setError] = useState("");
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null); // 주문 완료 결과

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!receiverName || !receiverPhone || !address) {
      setError("배송 정보를 모두 입력해 주세요.");
      return;
    }

    setSubmitting(true);
    setError("");
    try {
      const order = await createOrder({
        items: items.map((item) => ({ productId: item.productId, quantity: item.quantity })),
        receiverName,
        receiverPhone,
        address,
        paymentMethod,
      });
      setCompletedOrder(order);
      removeItems(items.map((item) => item.productId)); // 주문한 상품만 장바구니에서 뺀다
    } catch (err) {
      setError(err instanceof Error ? err.message : "주문 중 오류가 발생했습니다.");
    } finally {
      setSubmitting(false);
    }
  }

  // 1) 주문 완료 화면 (장바구니가 비워지므로 가장 먼저 확인한다)
  if (completedOrder) {
    return (
      <div className="p-8 text-center">
        <h1 className="text-2xl font-bold">주문이 완료되었습니다</h1>
        <p className="mt-4 text-gray-600">주문 번호: {completedOrder.id}</p>
        <p className="text-gray-600">결제 금액: {formatPrice(completedOrder.totalPrice)}</p>
        <div className="mt-8 flex justify-center gap-4">
          <Link href="/mypage/orders" className="rounded bg-blue-600 px-6 py-2 text-white">
            주문 내역 보기
          </Link>
          <Link href="/products" className="rounded border px-6 py-2">
            쇼핑 계속하기
          </Link>
        </div>
      </div>
    );
  }

  // 2) 장바구니가 비어 있을 때
  if (items.length === 0) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold">주문/결제</h1>
        <p className="mt-6 text-gray-500">주문할 상품이 없습니다.</p>
        <Link href="/products" className="mt-4 inline-block text-blue-600 underline">
          상품 보러 가기
        </Link>
      </div>
    );
  }

  // 3) 주문서
  return (
    <form onSubmit={handleSubmit} className="grid gap-8 p-8 md:grid-cols-2">
      <div>
        <h1 className="text-2xl font-bold">주문/결제</h1>

        <h2 className="mt-6 font-semibold">배송 정보</h2>
        <div className="mt-2 flex flex-col gap-3">
          <label className="flex flex-col gap-1 text-sm">
            받는 사람
            <input value={receiverName} onChange={(e) => setReceiverName(e.target.value)} className="rounded border px-3 py-2" />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            연락처
            <input value={receiverPhone} onChange={(e) => setReceiverPhone(e.target.value)} className="rounded border px-3 py-2" />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            주소
            <input value={address} onChange={(e) => setAddress(e.target.value)} className="rounded border px-3 py-2" />
          </label>
        </div>

        <h2 className="mt-6 font-semibold">결제 수단 (가짜 결제)</h2>
        <div className="mt-2 flex gap-4 text-sm">
          <label className="flex items-center gap-1">
            <input type="radio" checked={paymentMethod === "CARD"} onChange={() => setPaymentMethod("CARD")} />
            신용카드
          </label>
          <label className="flex items-center gap-1">
            <input type="radio" checked={paymentMethod === "BANK_TRANSFER"} onChange={() => setPaymentMethod("BANK_TRANSFER")} />
            계좌이체
          </label>
        </div>
      </div>

      <div className="rounded border bg-white p-4">
        <h2 className="font-semibold">주문 상품</h2>
        <ul className="mt-2 divide-y text-sm">
          {items.map((item) => (
            <li key={item.productId} className="flex justify-between py-2">
              <span>
                {item.name} × {item.quantity}
              </span>
              <span>{formatPrice(item.price * item.quantity)}</span>
            </li>
          ))}
        </ul>
        <div className="mt-4 space-y-1 border-t pt-4 text-sm">
          <p className="flex justify-between">
            <span className="text-gray-600">상품금액</span>
            <span>{formatPrice(checkoutPrice)}</span>
          </p>
          <p className="flex justify-between">
            <span className="text-gray-600">배송비</span>
            <span>{shippingFee === 0 ? "무료" : `+${formatPrice(shippingFee)}`}</span>
          </p>
        </div>
        <p className="mt-2 flex justify-between text-lg font-bold">
          <span>총 결제 금액</span>
          <span>{formatPrice(totalPrice)}</span>
        </p>

        {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="mt-4 w-full rounded bg-blue-600 py-3 text-white hover:bg-blue-700 disabled:bg-gray-400"
        >
          {submitting ? "결제 처리 중..." : `${formatPrice(totalPrice)} 결제하기`}
        </button>
      </div>
    </form>
  );
}
