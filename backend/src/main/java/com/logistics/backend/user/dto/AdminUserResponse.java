package com.logistics.backend.user.dto;

import com.logistics.backend.user.entity.Role;
import com.logistics.backend.user.entity.User;

import java.time.LocalDateTime;

// 관리자 회원 목록 한 줄 (비밀번호 없음)
public record AdminUserResponse(
        Long id,
        String email,
        String name,
        String phone,
        Role role,
        LocalDateTime createdAt,
        long orderCount
) {

    public static AdminUserResponse of(User user, long orderCount) {
        return new AdminUserResponse(
                user.getId(),
                user.getEmail(),
                user.getName(),
                user.getPhone(),
                user.getRole(),
                user.getCreatedAt(),
                orderCount
        );
    }
}
