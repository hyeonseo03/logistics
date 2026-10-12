package com.logistics.backend.inventory.dto;

// 상품별 판매가능재고 합계 (InventoryRepository 의 합계 쿼리 결과를 담는 그릇)
public record ProductStockTotal(
        Long productId,
        Long totalStock
) {
}
