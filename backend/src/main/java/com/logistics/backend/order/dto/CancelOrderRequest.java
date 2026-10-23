package com.logistics.backend.order.dto;

import jakarta.validation.constraints.Size;

// POST /api/orders/{id}/cancel 요청 (본문은 생략 가능)
public record CancelOrderRequest(
        @Size(max = 200, message = "사유는 200자 이하로 입력해 주세요.")
        String reason
) {
}
