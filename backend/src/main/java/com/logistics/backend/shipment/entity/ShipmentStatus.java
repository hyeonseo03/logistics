package com.logistics.backend.shipment.entity;

import com.logistics.backend.order.entity.OrderStatus;
import lombok.Getter;
import lombok.RequiredArgsConstructor;

// 배송 상태 (주문 상태를 배송 관점으로 묶은 것)
@Getter
@RequiredArgsConstructor
public enum ShipmentStatus {
    PREPARING("상품준비"),   // 주문완료·포장
    SHIPPED("출고"),
    IN_TRANSIT("배송중"),
    DELIVERED("배송완료"),
    CANCELED("취소"),
    RETURNING("회수중"),
    RETURNED("회수완료");

    private final String label;

    public static ShipmentStatus from(OrderStatus orderStatus) {
        return switch (orderStatus) {
            case ORDERED, PACKING -> PREPARING;
            case SHIPPED -> SHIPPED;
            case IN_TRANSIT -> IN_TRANSIT;
            case DELIVERED -> DELIVERED;
            case CANCELED -> CANCELED;
            case RETURNING -> RETURNING;
            case RETURNED -> RETURNED;
        };
    }
}
