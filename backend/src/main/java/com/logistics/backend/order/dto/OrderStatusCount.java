package com.logistics.backend.order.dto;

import com.logistics.backend.order.entity.OrderStatus;

// 상태별 주문 수 (OrderRepository 의 group by 쿼리 결과를 담는 그릇)
public record OrderStatusCount(
        OrderStatus status,
        Long count
) {
}
