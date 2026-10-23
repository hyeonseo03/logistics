package com.logistics.backend.product.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

// 관리자 상품 등록/수정 요청
public record ProductRequest(
        @NotNull(message = "카테고리를 선택해 주세요.")
        Long categoryId,

        @NotBlank(message = "상품 이름을 입력해 주세요.")
        @Size(max = 100, message = "상품 이름은 100자 이하로 입력해 주세요.")
        String name,

        @NotBlank(message = "상품 설명을 입력해 주세요.")
        String description,

        @Min(value = 0, message = "가격은 0원 이상이어야 합니다.")
        @Max(value = 100_000_000, message = "가격이 너무 큽니다.")
        int price,

        String optionName, // 없으면 null
        String imageUrl    // 없으면 null
) {
}
