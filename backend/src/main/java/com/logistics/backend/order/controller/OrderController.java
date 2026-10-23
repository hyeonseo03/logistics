package com.logistics.backend.order.controller;

import com.logistics.backend.global.security.LoginUser;
import com.logistics.backend.order.dto.CreateOrderRequest;
import com.logistics.backend.order.dto.OrderResponse;
import com.logistics.backend.order.service.OrderService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

// 주문 (로그인 필요)
@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
public class OrderController {

    private final OrderService orderService;

    // POST /api/orders (장바구니 → 주문, 모의 결제로 즉시 결제완료)
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public OrderResponse createOrder(@AuthenticationPrincipal LoginUser loginUser,
                                     @Valid @RequestBody CreateOrderRequest request) {
        return orderService.createOrder(loginUser.id(), request);
    }

    // GET /api/orders (내 주문 목록). 프론트 위시리스트의 /api/orders/me 도 같은 결과
    @GetMapping({"", "/me"})
    public List<OrderResponse> getMyOrders(@AuthenticationPrincipal LoginUser loginUser) {
        return orderService.getMyOrders(loginUser.id());
    }

    // GET /api/orders/{id}
    @GetMapping("/{id}")
    public OrderResponse getMyOrder(@AuthenticationPrincipal LoginUser loginUser, @PathVariable Long id) {
        return orderService.getMyOrder(loginUser.id(), id);
    }
}
