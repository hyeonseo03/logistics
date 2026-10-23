package com.logistics.backend.order.dto;

// 회원별 주문 수 (OrderRepository 의 group by 쿼리 결과를 담는 그릇)
public record UserOrderCount(
        Long userId,
        Long count
) {
}
