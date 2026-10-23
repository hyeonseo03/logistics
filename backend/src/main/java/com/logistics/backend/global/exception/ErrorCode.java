package com.logistics.backend.global.exception;

import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;

// 서비스에서 발생할 수 있는 에러를 한 곳에 모아 둔다. 응답 JSON 의 code 는 이 enum 이름이 된다
@Getter
@RequiredArgsConstructor
public enum ErrorCode {

    // 공통
    INVALID_INPUT(HttpStatus.BAD_REQUEST, "입력값이 올바르지 않습니다."),
    NOT_FOUND(HttpStatus.NOT_FOUND, "요청한 데이터를 찾을 수 없습니다."),
    METHOD_NOT_ALLOWED(HttpStatus.METHOD_NOT_ALLOWED, "지원하지 않는 요청 방식입니다."),
    CONCURRENT_MODIFICATION(HttpStatus.CONFLICT, "다른 요청이 먼저 처리되었습니다. 새로고침 후 다시 시도해 주세요."),
    INTERNAL_ERROR(HttpStatus.INTERNAL_SERVER_ERROR, "서버 오류가 발생했습니다."),

    // 인증·권한
    UNAUTHORIZED(HttpStatus.UNAUTHORIZED, "로그인이 필요합니다."),
    INVALID_TOKEN(HttpStatus.UNAUTHORIZED, "로그인 정보가 올바르지 않거나 만료되었습니다. 다시 로그인해 주세요."),
    FORBIDDEN(HttpStatus.FORBIDDEN, "권한이 없습니다."),
    LOGIN_FAILED(HttpStatus.UNAUTHORIZED, "이메일 또는 비밀번호가 일치하지 않습니다."),
    WRONG_PASSWORD(HttpStatus.UNAUTHORIZED, "비밀번호가 일치하지 않습니다."),

    // 회원
    DUPLICATE_EMAIL(HttpStatus.CONFLICT, "이미 가입된 이메일입니다."),
    USER_NOT_FOUND(HttpStatus.NOT_FOUND, "회원을 찾을 수 없습니다."),
    ADDRESS_NOT_FOUND(HttpStatus.NOT_FOUND, "배송지를 찾을 수 없습니다."),

    // 상품·재고
    PRODUCT_NOT_FOUND(HttpStatus.NOT_FOUND, "상품을 찾을 수 없습니다."),
    CATEGORY_NOT_FOUND(HttpStatus.NOT_FOUND, "카테고리를 찾을 수 없습니다."),
    WAREHOUSE_NOT_FOUND(HttpStatus.NOT_FOUND, "물류센터를 찾을 수 없습니다."),
    PRODUCT_IN_USE(HttpStatus.CONFLICT, "주문 이력이 있는 상품은 삭제할 수 없습니다."),
    OUT_OF_STOCK(HttpStatus.CONFLICT, "재고가 부족합니다."),
    INVALID_STOCK_QUANTITY(HttpStatus.BAD_REQUEST, "재고 수량은 예약된 수량보다 적게 설정할 수 없습니다."),

    // 장바구니·주문
    CART_EMPTY(HttpStatus.BAD_REQUEST, "주문할 상품이 장바구니에 없습니다."),
    CART_ITEM_NOT_FOUND(HttpStatus.NOT_FOUND, "장바구니에 없는 상품입니다."),
    ORDER_NOT_FOUND(HttpStatus.NOT_FOUND, "주문을 찾을 수 없습니다."),
    INVALID_STATUS_CHANGE(HttpStatus.CONFLICT, "현재 주문 상태에서는 바꿀 수 없는 상태입니다."),
    ADDRESS_CHANGE_NOT_ALLOWED(HttpStatus.CONFLICT, "출고된 이후에는 배송지를 변경할 수 없습니다."),
    SHIPMENT_NOT_FOUND(HttpStatus.NOT_FOUND, "배송 정보를 찾을 수 없습니다.");

    private final HttpStatus status;
    private final String message;
}
