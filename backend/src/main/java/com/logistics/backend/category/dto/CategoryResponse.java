package com.logistics.backend.category.dto;

import com.logistics.backend.category.entity.Category;

// 프론트 types/product.ts 의 Category 와 같은 모양
public record CategoryResponse(
        Long id,
        String name
) {

    public static CategoryResponse from(Category category) {
        return new CategoryResponse(category.getId(), category.getName());
    }
}
