"use client";

import { useEffect, useState } from "react";
import AddressForm from "@/components/mypage/AddressForm";
import { createAddress, deleteAddress, getMyAddresses, setDefaultAddress, updateAddress } from "@/lib/api";
import type { Address, AddressRequest } from "@/types/user";

// 새 배송지 폼의 빈 값
const emptyAddress: AddressRequest = {
  label: "",
  receiverName: "",
  receiverPhone: "",
  address: "",
  isDefault: false,
};

// 배송지 목록 + 추가 / 수정 / 삭제 / 기본 배송지 설정
export default function AddressManager() {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false); // "새 배송지" 폼을 열었는지
  const [editingId, setEditingId] = useState<number | null>(null); // 수정 중인 배송지
  const [error, setError] = useState("");

  useEffect(() => {
    getMyAddresses().then((data) => {
      setAddresses(data);
      setLoading(false);
    });
  }, []);

  // 저장/삭제 후 목록을 다시 불러온다 (기본 배송지가 바뀌면 다른 배송지도 바뀌므로)
  async function reload() {
    setAddresses(await getMyAddresses());
  }

  async function handleCreate(request: AddressRequest) {
    await createAddress(request);
    await reload();
    setAdding(false);
  }

  async function handleUpdate(addressId: number, request: AddressRequest) {
    await updateAddress(addressId, request);
    await reload();
    setEditingId(null);
  }

  // 삭제, 기본 배송지 설정처럼 버튼 한 번으로 끝나는 작업
  async function run(action: () => Promise<void>) {
    setError("");
    try {
      await action();
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "처리에 실패했습니다.");
    }
  }

  function handleDelete(address: Address) {
    if (!confirm(`'${address.label}' 배송지를 삭제할까요?`)) return;
    run(() => deleteAddress(address.id));
  }

  if (loading) return <p className="text-gray-500">불러오는 중...</p>;

  return (
    <div className="flex flex-col gap-4">
      {error && <p className="text-sm text-red-600">{error}</p>}

      {addresses.length === 0 && !adding && (
        <p className="rounded-lg border bg-white p-6 text-center text-gray-500">등록된 배송지가 없습니다.</p>
      )}

      <ul className="flex flex-col gap-3">
        {addresses.map((address) =>
          editingId === address.id ? (
            <li key={address.id}>
              <AddressForm
                initial={{
                  label: address.label,
                  receiverName: address.receiverName,
                  receiverPhone: address.receiverPhone,
                  address: address.address,
                  isDefault: address.isDefault,
                }}
                lockDefault={address.isDefault}
                submitLabel="수정 완료"
                onSubmit={(request) => handleUpdate(address.id, request)}
                onCancel={() => setEditingId(null)}
              />
            </li>
          ) : (
            <li key={address.id} className="rounded-lg border bg-white p-4 text-sm">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-semibold">{address.label}</span>
                {address.isDefault && (
                  <span className="rounded bg-blue-100 px-2 py-0.5 text-xs text-blue-700">기본 배송지</span>
                )}
              </div>
              <p className="mt-1">
                {address.receiverName} · {address.receiverPhone}
              </p>
              <p className="text-gray-600">{address.address}</p>

              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setAdding(false);
                    setEditingId(address.id);
                  }}
                  className="rounded border px-3 py-1 hover:bg-gray-50"
                >
                  수정
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(address)}
                  className="rounded border px-3 py-1 text-red-600 hover:bg-red-50"
                >
                  삭제
                </button>
                {!address.isDefault && (
                  <button
                    type="button"
                    onClick={() => run(() => setDefaultAddress(address.id))}
                    className="rounded border px-3 py-1 hover:bg-gray-50"
                  >
                    기본 배송지로 설정
                  </button>
                )}
              </div>
            </li>
          )
        )}
      </ul>

      {adding ? (
        <AddressForm
          initial={{ ...emptyAddress, isDefault: addresses.length === 0 }}
          lockDefault={addresses.length === 0}
          submitLabel="추가"
          onSubmit={handleCreate}
          onCancel={() => setAdding(false)}
        />
      ) : (
        <button
          type="button"
          onClick={() => {
            setEditingId(null);
            setAdding(true);
          }}
          className="rounded-lg border border-dashed py-3 text-sm text-gray-600 hover:bg-gray-50"
        >
          + 새 배송지 추가
        </button>
      )}
    </div>
  );
}
