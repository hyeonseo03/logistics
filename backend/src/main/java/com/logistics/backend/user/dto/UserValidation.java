package com.logistics.backend.user.dto;

// 여러 요청 DTO 에서 같이 쓰는 검사 규칙 (프론트 lib/validation.ts 와 같은 규칙)
public final class UserValidation {

    // 휴대폰 번호: 010-1234-5678 (가운데는 3~4자리)
    public static final String PHONE_REGEX = "^01[016789]-\\d{3,4}-\\d{4}$";

    private UserValidation() {
    }
}
