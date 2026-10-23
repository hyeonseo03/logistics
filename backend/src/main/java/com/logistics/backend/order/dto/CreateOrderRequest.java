package com.logistics.backend.order.dto;

import com.logistics.backend.order.entity.PaymentMethod;
import jakarta.validation.constraints.NotNull;

import java.util.List;

// POST /api/orders 요청: 장바구니에 담긴 상품으로 주문한다
// 배송지는 둘 중 하나로 정한다
//  1) addressId: 내 배송지 목록에서 고르기
//  2) receiverName + receiverPhone + address: 직접 입력
public record CreateOrderRequest(
        Long addressId,
        String receiverName,
        String receiverPhone,
        String address,

        @NotNull(message = "결제 수단을 선택해 주세요.")
        PaymentMethod paymentMethod,

        List<Long> productIds // 장바구니에서 주문할 상품만 고를 때. 비우면 장바구니 전체
) {
}
