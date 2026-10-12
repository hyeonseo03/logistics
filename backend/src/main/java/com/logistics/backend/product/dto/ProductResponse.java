package com.logistics.backend.product.dto;

import com.logistics.backend.product.entity.Product;

import java.time.LocalDateTime;

// 프론트 types/product.ts 의 Product 필드 + categoryName
public record ProductResponse(
        Long id,
        Long categoryId,
        String categoryName,
        String name,
        String description,
        int price,
        String optionName,
        String imageUrl,
        LocalDateTime createdAt
) {

    public static ProductResponse from(Product product) {
        return new ProductResponse(
                product.getId(),
                product.getCategory().getId(),
                product.getCategory().getName(),
                product.getName(),
                product.getDescription(),
                product.getPrice(),
                product.getOptionName(),
                product.getImageUrl(),
                product.getCreatedAt()
        );
    }
}
