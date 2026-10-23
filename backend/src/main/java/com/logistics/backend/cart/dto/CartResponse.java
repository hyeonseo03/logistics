package com.logistics.backend.cart.dto;

import java.util.List;

// GET /api/cart 응답: 장바구니 목록 + 결제 요약 (품절 상품은 금액 계산에서 빠진다)
public record CartResponse(
        List<CartItemResponse> items,
        int productTotal, // 상품금액
        int shippingFee,  // 배송비 (30,000원 이상 무료)
        int totalPrice    // 총 결제금액 = 상품금액 + 배송비
) {
}
