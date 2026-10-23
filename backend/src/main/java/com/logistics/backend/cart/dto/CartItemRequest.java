package com.logistics.backend.cart.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

// POST /api/cart/items 요청 (담기)
public record CartItemRequest(
        @NotNull(message = "상품을 선택해 주세요.")
        Long productId,

        @Min(value = 1, message = "수량은 1개 이상이어야 합니다.")
        @Max(value = 99, message = "수량은 99개 이하여야 합니다.")
        int quantity
) {
}
