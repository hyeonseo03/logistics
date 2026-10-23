package com.logistics.backend.order.dto;

// POST /api/orders/{id}/cancel 응답
public record CancelOrderResponse(
        CancelResult result,
        String message,
        OrderResponse order // 처리 후 주문 상태
) {
}
