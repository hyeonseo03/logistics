package com.logistics.backend.user.dto;

// 로그인 성공 응답. 프론트는 accessToken 을 저장해 두었다가
// 이후 요청마다 "Authorization: Bearer {accessToken}" 헤더로 보낸다
public record LoginResponse(
        String accessToken,
        String tokenType,  // 항상 "Bearer"
        long expiresIn,    // 토큰 유효 시간 (초)
        UserResponse user
) {
}
