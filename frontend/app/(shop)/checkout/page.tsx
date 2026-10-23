"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/common/AuthContext";
import RequireLogin from "@/components/common/RequireLogin";
import { useCart } from "@/components/order/CartContext";
import { createOrder, getMyAddresses } from "@/lib/api";
import { formatPrice } from "@/lib/format";
import { getShippingFee } from "@/lib/price";
import { isValidName, isValidPhone } from "@/lib/validation";
import type { Order, PaymentMethod } from "@/types/order";
import type { Address, User } from "@/types/user";

export default function CheckoutPage() {
  return (
    <RequireLogin>
      <CheckoutContent />
    </RequireLogin>
  );
}

function CheckoutContent() {
  const { user } = useAuth();
  if (!user) return null; // RequireLogin 안이라 항상 로그인되어 있다
  return <CheckoutLoader user={user} />;
}

// 내 배송지 목록을 불러온 뒤 주문서를 보여준다 (주문서 입력칸을 기본 배송지로 미리 채우기 위해)
function CheckoutLoader({ user }: { user: User }) {
  const [addresses, setAddresses] = useState<Address[] | null>(null); // null: 불러오는 중

  useEffect(() => {
    getMyAddresses()
      .then(setAddresses)
      .catch(() => setAddresses([])); // 못 불러오면 직접 입력
  }, []);

  if (addresses === null) return <p className="p-8 text-gray-500">불러오는 중...</p>;
  return <CheckoutForm user={user} addresses={addresses} />;
}

function CheckoutForm({ user, addresses }: { user: User; addresses: Address[] }) {
  // 장바구니에서 체크했고 품절이 아닌 상품만 주문한다
  const { checkoutItems: items, checkoutPrice, reload, loading } = useCart();
  const shippingFee = getShippingFee(checkoutPrice);
  const totalPrice = checkoutPrice + shippingFee;

  // 배송 정보 입력값 (기본 배송지로 미리 채운다. 배송지가 없으면 회원 정보로)
  const defaultAddress = addresses.find((a) => a.isDefault);
  const [receiverName, setReceiverName] = useState(defaultAddress?.receiverName ?? user.name);
  const [receiverPhone, setReceiverPhone] = useState(defaultAddress?.receiverPhone ?? user.phone);
  const [address, setAddress] = useState(defaultAddress?.address ?? "");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("CARD");

  const [submitting, setSubmitting] = useState(false); // 주문 요청 중인지
  const [error, setError] = useState("");
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null); // 주문 완료 결과

  // 저장된 배송지를 고르면 입력칸을 그 값으로 채운다
  function fillAddress(addressId: number) {
    const selected = addresses.find((a) => a.id === addressId);
    if (!selected) return;
    setReceiverName(selected.receiverName);
    setReceiverPhone(selected.receiverPhone);
    setAddress(selected.address);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!isValidName(receiverName)) return setError("받는 사람을 1~20자로 입력해 주세요.");
    if (!isValidPhone(receiverPhone)) return setError("연락처를 010-1234-5678 형식으로 입력해 주세요.");
    if (!address.trim()) return setError("주소를 입력해 주세요.");

    setSubmitting(true);
    setError("");
    try {
      // 금액·재고·출고 센터는 백엔드가 다시 계산한다 (화면 금액은 미리보기)
      const order = await createOrder({
        receiverName: receiverName.trim(),
        receiverPhone,
        address: address.trim(),
        paymentMethod,
        productIds: items.map((item) => item.productId),
      });
      setCompletedOrder(order);
      await reload(); // 주문한 상품은 백엔드가 장바구니에서 지웠다
    } catch (err) {
      setError(err instanceof Error ? err.message : "주문 중 오류가 발생했습니다.");
      await reload(); // 재고 부족 등으로 실패했으면 최신 재고로 다시 보여준다
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
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <Link href={`/tracking/${completedOrder.id}`} className="rounded bg-blue-600 px-6 py-2 text-white">
            배송 조회
          </Link>
          <Link href="/mypage/orders" className="rounded border px-6 py-2">
            주문 내역 보기
          </Link>
          <Link href="/products" className="rounded border px-6 py-2">
            쇼핑 계속하기
          </Link>
        </div>
      </div>
    );
  }

  if (loading) return <p className="p-8 text-gray-500">불러오는 중...</p>;

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
    <form onSubmit={handleSubmit} className="grid gap-8 p-4 sm:p-8 md:grid-cols-2">
      <div>
        <h1 className="text-2xl font-bold">주문/결제</h1>

        <h2 className="mt-6 font-semibold">배송 정보</h2>
        {addresses.length > 0 && (
          <label className="mt-2 flex flex-col gap-1 text-sm">
            저장된 배송지에서 고르기
            <select
              defaultValue={defaultAddress?.id ?? ""}
              onChange={(e) => fillAddress(Number(e.target.value))}
              className="rounded border px-3 py-2"
            >
              {!defaultAddress && <option value="">선택하세요</option>}
              {addresses.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.label} · {a.address}
                </option>
              ))}
            </select>
          </label>
        )}
        <div className="mt-3 flex flex-col gap-3">
          <label className="flex flex-col gap-1 text-sm">
            받는 사람
            <input value={receiverName} onChange={(e) => setReceiverName(e.target.value)} className="rounded border px-3 py-2" />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            연락처
            <input
              value={receiverPhone}
              onChange={(e) => setReceiverPhone(e.target.value)}
              placeholder="010-1234-5678"
              inputMode="tel"
              className="rounded border px-3 py-2"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            주소
            <input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="서울시 강남구 테헤란로 123"
              className="rounded border px-3 py-2"
            />
          </label>
          <p className="text-xs text-gray-500">주소의 지역(서울·경기·부산)에서 가까운 물류센터에서 출고됩니다.</p>
        </div>

        <h2 className="mt-6 font-semibold">결제 수단 (모의 결제)</h2>
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

      <div className="rounded border bg-white p-4 md:self-start">
        <h2 className="font-semibold">주문 상품</h2>
        <ul className="mt-2 divide-y text-sm">
          {items.map((item) => (
            <li key={item.productId} className="flex justify-between gap-2 py-2">
              <span>
                {item.productName} × {item.quantity}
              </span>
              <span className="whitespace-nowrap">{formatPrice(item.lineTotal)}</span>
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
