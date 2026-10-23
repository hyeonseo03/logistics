package com.logistics.backend.order.entity;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

import java.util.EnumSet;
import java.util.Set;

// 주문 상태와 "어떤 상태에서 어떤 상태로 바뀔 수 있는지" 규칙을 이 enum 한 곳에 모아 둔다
//
// 정방향:   ORDERED(주문완료) → PACKING(포장) → SHIPPED(출고) → IN_TRANSIT(배송중) → DELIVERED(배송완료)
// 되돌리기: ORDERED, PACKING            → CANCELED(취소)        : 아직 창고 안 → 즉시 취소
//          SHIPPED, IN_TRANSIT, DELIVERED → RETURNING(회수중) → RETURNED(회수완료) : 이미 출고 → 회수
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

    // 이 상태에서 바로 다음으로 바뀔 수 있는 상태들 (상태 전이 규칙)
    public Set<OrderStatus> nextStatuses() {
        return switch (this) {
            case ORDERED -> EnumSet.of(PACKING, CANCELED);
            case PACKING -> EnumSet.of(SHIPPED, CANCELED);
            case SHIPPED -> EnumSet.of(IN_TRANSIT, RETURNING);
            case IN_TRANSIT -> EnumSet.of(DELIVERED, RETURNING);
            case DELIVERED -> EnumSet.of(RETURNING);
            case RETURNING -> EnumSet.of(RETURNED);
            case CANCELED, RETURNED -> EnumSet.noneOf(OrderStatus.class); // 끝난 상태
        };
    }

    public boolean canChangeTo(OrderStatus next) {
        return nextStatuses().contains(next);
    }

    // 지금 고객이 취소 버튼을 누르면 어떻게 되는지
    public CancelType cancelType() {
        return switch (this) {
            case ORDERED, PACKING -> CancelType.IMMEDIATE_CANCEL;
            case SHIPPED, IN_TRANSIT, DELIVERED -> CancelType.RETURN;
            case CANCELED, RETURNING, RETURNED -> CancelType.ALREADY_PROCESSED;
        };
    }

    // 배송지는 출고(SHIPPED) 전에만 바꿀 수 있다
    public boolean canChangeAddress() {
        return this == ORDERED || this == PACKING;
    }
}
