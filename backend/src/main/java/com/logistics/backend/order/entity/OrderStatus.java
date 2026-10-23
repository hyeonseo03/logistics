package com.logistics.backend.order.entity;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

// 주문 상태
// 정방향: ORDERED(주문완료) → PACKING(포장) → SHIPPED(출고) → IN_TRANSIT(배송중) → DELIVERED(배송완료)
// 되돌리기: CANCELED(취소), RETURNING(회수중), RETURNED(회수완료)
@Getter
@RequiredArgsConstructor
public enum OrderStatus {
    ORDERED("주문완료"),
    PACKING("포장"),
    SHIPPED("출고"),
    IN_TRANSIT("배송중"),
    DELIVERED("배송완료"),
    CANCELED("취소"),
    RETURNING("회수중"),
    RETURNED("회수완료");

    private final String label;
}
