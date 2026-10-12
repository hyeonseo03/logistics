package com.logistics.backend.product.dto;

import com.logistics.backend.product.entity.Product;

import java.time.LocalDateTime;

// 프론트 types/product.ts 의 Product 필드 + categoryName + totalStock
public record ProductResponse(
        Long id,
        Long categoryId,
        String categoryName,
        String name,
        String description,
        int price,
        String optionName,
        String imageUrl,
        LocalDateTime createdAt,
        long totalStock // 모든 물류센터의 판매가능재고 합계 (재고 상태 판단은 프론트 lib/stock.ts 가 한다)
) {

    public static ProductResponse from(Product product, long totalStock) {
        return new ProductResponse(
                product.getId(),
                product.getCategory().getId(),
                product.getCategory().getName(),
                product.getName(),
                product.getDescription(),
                product.getPrice(),
                product.getOptionName(),
                product.getImageUrl(),
                product.getCreatedAt(),
                totalStock
        );
    }
}
