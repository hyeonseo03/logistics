package com.logistics.backend.cart.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;

// PATCH /api/cart/items/{productId} 요청 (수량 변경)
public record CartQuantityRequest(
        @Min(value = 1, message = "수량은 1개 이상이어야 합니다.")
        @Max(value = 99, message = "수량은 99개 이하여야 합니다.")
        int quantity
) {
}
