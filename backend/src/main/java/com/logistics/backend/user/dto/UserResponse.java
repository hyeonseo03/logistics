package com.logistics.backend.user.dto;

import com.logistics.backend.user.entity.Role;
import com.logistics.backend.user.entity.User;

import java.time.LocalDateTime;

// 프론트 types/user.ts 의 User 와 같은 모양 (비밀번호는 절대 넣지 않는다)
public record UserResponse(
        Long id,
        String email,
        String name,
        String phone,
        Role role,
        LocalDateTime createdAt
) {

    public static UserResponse from(User user) {
        return new UserResponse(
                user.getId(),
                user.getEmail(),
                user.getName(),
                user.getPhone(),
                user.getRole(),
                user.getCreatedAt()
        );
    }
}
