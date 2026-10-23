package com.logistics.backend.global.exception;

// 모든 에러 응답의 모양: { "code": "OUT_OF_STOCK", "message": "재고가 부족합니다." }
public record ErrorResponse(
        String code,
        String message
) {

    public static ErrorResponse of(ErrorCode errorCode) {
        return new ErrorResponse(errorCode.name(), errorCode.getMessage());
    }

    public static ErrorResponse of(ErrorCode errorCode, String message) {
        return new ErrorResponse(errorCode.name(), message);
    }
}
