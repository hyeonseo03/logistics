package com.logistics.backend.product.dto;

import com.logistics.backend.product.entity.RestockAlert;

import java.time.LocalDateTime;

// 재입고 알림 한 건 + 상품의 현재 정보(재고 합계 포함). 프론트 types/product.ts 의 RestockAlert
public record RestockAlertResponse(
        Long id,
        Long userId,
        Long productId,
        LocalDateTime createdAt,
        ProductResponse product
) {

    public static RestockAlertResponse of(RestockAlert alert, long totalStock) {
        return new RestockAlertResponse(
                alert.getId(),
                alert.getUser().getId(),
                alert.getProduct().getId(),
                alert.getCreatedAt(),
                ProductResponse.from(alert.getProduct(), totalStock)
        );
    }
}
