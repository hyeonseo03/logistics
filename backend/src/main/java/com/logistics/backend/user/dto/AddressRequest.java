package com.logistics.backend.user.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

// 배송지 추가/수정 요청 (프론트 types/user.ts 의 AddressRequest 와 같은 모양)
public record AddressRequest(
        @NotBlank(message = "배송지 이름을 입력해 주세요.")
        @Size(max = 20, message = "배송지 이름은 20자 이하로 입력해 주세요.")
        String label,

        @NotBlank(message = "받는 사람을 입력해 주세요.")
        @Size(max = 20, message = "받는 사람을 1~20자로 입력해 주세요.")
        String receiverName,

        @NotBlank(message = "전화번호를 입력해 주세요.")
        @Pattern(regexp = UserValidation.PHONE_REGEX, message = "전화번호 형식이 올바르지 않습니다. (예: 010-1234-5678)")
        String receiverPhone,

        @NotBlank(message = "주소를 입력해 주세요.")
        String address,

        boolean isDefault // true 면 이 배송지를 기본 배송지로 만든다
) {
}
