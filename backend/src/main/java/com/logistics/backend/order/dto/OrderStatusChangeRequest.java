package com.logistics.backend.order.dto;

import com.logistics.backend.order.entity.OrderStatus;
import jakarta.validation.constraints.NotNull;

// PATCH /api/admin/orders/{id}/status 요청 { "status": "SHIPPED" }
public record OrderStatusChangeRequest(
        @NotNull(message = "바꿀 상태를 선택해 주세요.")
        OrderStatus status
) {
}
