package com.logistics.backend.global.policy;

// 배송비 규칙 (프론트 lib/price.ts 와 같은 규칙). 장바구니와 주문에서 같이 쓴다
public final class ShippingFeePolicy {

    public static final int FREE_SHIPPING_THRESHOLD = 30000; // 상품금액이 이 금액 이상이면 무료배송
    public static final int SHIPPING_FEE = 3000;

    private ShippingFeePolicy() {
    }

    // 상품금액 → 배송비 (주문할 상품이 없으면 0원)
    public static int calculate(int productTotal) {
        if (productTotal == 0) {
            return 0;
        }
        return productTotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;
    }
}
