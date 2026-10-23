package com.logistics.backend.user.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

// POST /api/auth/signup 요청. 검사 규칙은 프론트 lib/validation.ts 와 같다
public record SignupRequest(
        @NotBlank(message = "이메일을 입력해 주세요.")
        @Email(message = "이메일 형식이 올바르지 않습니다.")
        String email,

        @NotBlank(message = "비밀번호를 입력해 주세요.")
        @Size(min = 8, max = 64, message = "비밀번호는 8자 이상이어야 합니다.")
        String password,

        @NotBlank(message = "이름을 입력해 주세요.")
        @Size(max = 20, message = "이름을 1~20자로 입력해 주세요.")
        String name,

        @NotBlank(message = "전화번호를 입력해 주세요.")
        @Pattern(regexp = UserValidation.PHONE_REGEX, message = "전화번호 형식이 올바르지 않습니다. (예: 010-1234-5678)")
        String phone
) {
}
