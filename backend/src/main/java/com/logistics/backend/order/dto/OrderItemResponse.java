package com.logistics.backend.order.dto;

import com.logistics.backend.order.entity.OrderItem;

// 프론트 types/order.ts 의 OrderItemWithProduct + 출고 센터 정보
public record OrderItemResponse(
        Long id,
        Long orderId,
        Long productId,
        String productName,
        Long warehouseId,
        String warehouseName,
        int quantity,
        int price,      // 주문 당시 상품 1개 가격
        int lineTotal   // price × quantity
) {

    public static OrderItemResponse from(OrderItem item) {
        return new OrderItemResponse(
                item.getId(),
                item.getOrder().getId(),
                item.getProduct().getId(),
                item.getProduct().getName(),
                item.getWarehouse().getId(),
                item.getWarehouse().getName(),
                item.getQuantity(),
                item.getPrice(),
                item.getLineTotal()
        );
    }
}
