package com.logistics.backend.global.exception;

import lombok.Getter;

// 업무 규칙 위반 시 서비스에서 던지는 예외. GlobalExceptionHandler 가 {code, message} JSON 으로 바꿔 준다
@Getter
public class BusinessException extends RuntimeException {

    private final ErrorCode errorCode;

    public BusinessException(ErrorCode errorCode) {
        super(errorCode.getMessage());
        this.errorCode = errorCode;
    }

    // 기본 메시지 대신 상황에 맞는 메시지를 쓰고 싶을 때 (예: "제주 감귤 3kg 의 재고가 부족합니다.")
    public BusinessException(ErrorCode errorCode, String message) {
        super(message);
        this.errorCode = errorCode;
    }
}
