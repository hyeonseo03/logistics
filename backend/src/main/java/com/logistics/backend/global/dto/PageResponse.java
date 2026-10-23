package com.logistics.backend.global.dto;

import org.springframework.data.domain.Page;

import java.util.List;

// 페이징 응답. Spring 의 Page 객체를 그대로 보내지 않고 필요한 값만 담는다
public record PageResponse<T>(
        List<T> content,
        int page,          // 현재 페이지 (0부터 시작)
        int size,          // 한 페이지 크기
        long totalElements,
        int totalPages
) {

    public static <T> PageResponse<T> from(Page<T> page) {
        return new PageResponse<>(
                page.getContent(),
                page.getNumber(),
                page.getSize(),
                page.getTotalElements(),
                page.getTotalPages()
        );
    }
}
