package com.logistics.backend.cart.dto;

import com.logistics.backend.cart.entity.CartItem;
import com.logistics.backend.product.entity.Product;

// 장바구니 한 줄 (상품 정보 + 담은 수량 + 현재 재고)
public record CartItemResponse(
        Long id,
        Long productId,
        String productName,
        String optionName,
        String imageUrl,
        String categoryName, // 이미지가 없을 때 카테고리별 그림을 보여주기 위해
        int price,         // 상품 1개 가격 (현재 가격)
        int quantity,
        int lineTotal,     // price × quantity
        long totalStock,   // 모든 물류센터의 판매가능재고 합계
        boolean soldOut    // 품절이면 주문할 수 없다
) {

    public static CartItemResponse from(CartItem item, long totalStock) {
        Product product = item.getProduct();
        return new CartItemResponse(
                item.getId(),
                product.getId(),
                product.getName(),
                product.getOptionName(),
                product.getImageUrl(),
                product.getCategory().getName(),
                product.getPrice(),
                item.getQuantity(),
                product.getPrice() * item.getQuantity(),
                totalStock,
                totalStock <= 0
        );
    }
}
