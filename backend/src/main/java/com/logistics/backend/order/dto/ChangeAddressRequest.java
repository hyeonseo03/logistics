package com.logistics.backend.order.dto;

// PATCH /api/orders/{id}/address 요청 (주문할 때와 같이 addressId 또는 직접 입력)
public record ChangeAddressRequest(
        Long addressId,
        String receiverName,
        String receiverPhone,
        String address
) {
}
