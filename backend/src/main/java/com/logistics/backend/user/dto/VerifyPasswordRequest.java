package com.logistics.backend.user.dto;

import jakarta.validation.constraints.NotBlank;

// POST /api/users/me/verify-password 요청 (마이페이지에서 내 정보 보기 전에 비밀번호 확인)
public record VerifyPasswordRequest(
        @NotBlank(message = "비밀번호를 입력해 주세요.")
        String password
) {
}
