package com.logistics.backend.order.dto;

import com.logistics.backend.order.entity.OrderStatus;
import com.logistics.backend.order.entity.OrderStatusHistory;

import java.time.LocalDateTime;

public record OrderStatusHistoryResponse(
        Long id,
        OrderStatus fromStatus, // 주문 생성 이력이면 null
        OrderStatus toStatus,
        Long changedBy,         // 바꾼 회원 id
        LocalDateTime changedAt
) {

    public static OrderStatusHistoryResponse from(OrderStatusHistory history) {
        return new OrderStatusHistoryResponse(
                history.getId(),
                history.getFromStatus(),
                history.getToStatus(),
                history.getChangedBy(),
                history.getChangedAt()
        );
    }
}
