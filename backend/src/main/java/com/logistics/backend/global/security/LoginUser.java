package com.logistics.backend.global.security;

import com.logistics.backend.user.entity.Role;

// 로그인한 사용자 정보 (JWT 안에 들어 있는 값).
// 컨트롤러에서 @AuthenticationPrincipal LoginUser loginUser 로 받아 쓴다
public record LoginUser(
        Long id,
        String email,
        Role role
) {
}
