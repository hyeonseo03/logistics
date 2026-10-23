package com.logistics.backend.inventory.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

// PUT /api/admin/inventories 요청: 이 상품의 이 센터 현재재고를 quantity 로 맞춘다
public record InventoryAdjustRequest(
        @NotNull(message = "상품을 선택해 주세요.")
        Long productId,

        @NotNull(message = "물류센터를 선택해 주세요.")
        Long warehouseId,

        @Min(value = 0, message = "재고는 0개 이상이어야 합니다.")
        @Max(value = 1_000_000, message = "재고가 너무 많습니다.")
        int quantity
) {
}
