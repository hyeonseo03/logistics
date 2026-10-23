package com.logistics.backend.user.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

// PUT /api/users/me 요청 (이메일은 바꿀 수 없다)
public record UpdateProfileRequest(
        @NotBlank(message = "이름을 입력해 주세요.")
        @Size(max = 20, message = "이름을 1~20자로 입력해 주세요.")
        String name,

        @NotBlank(message = "전화번호를 입력해 주세요.")
        @Pattern(regexp = UserValidation.PHONE_REGEX, message = "전화번호 형식이 올바르지 않습니다. (예: 010-1234-5678)")
        String phone
) {
}
