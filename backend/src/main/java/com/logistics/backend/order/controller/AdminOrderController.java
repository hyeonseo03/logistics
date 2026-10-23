package com.logistics.backend.order.controller;

import com.logistics.backend.global.dto.PageResponse;
import com.logistics.backend.global.security.LoginUser;
import com.logistics.backend.order.dto.OrderResponse;
import com.logistics.backend.order.dto.OrderStatusChangeRequest;
import com.logistics.backend.order.dto.OrderStatusHistoryResponse;
import com.logistics.backend.order.entity.OrderStatus;
import com.logistics.backend.order.service.AdminOrderService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

// 관리자 주문 관리 (/api/admin/** 는 SecurityConfig 에서 ADMIN 만 허용)
@RestController
@RequestMapping("/api/admin/orders")
@RequiredArgsConstructor
public class AdminOrderController {

    private final AdminOrderService adminOrderService;

    // GET /api/admin/orders?status=ORDERED&page=0&size=20
    @GetMapping
    public PageResponse<OrderResponse> getOrders(@RequestParam(required = false) OrderStatus status,
                                                 @RequestParam(defaultValue = "0") @Min(0) int page,
                                                 @RequestParam(defaultValue = "20") @Min(1) @Max(100) int size) {
        return adminOrderService.getOrders(status, page, size);
    }

    @GetMapping("/{id}")
    public OrderResponse getOrder(@PathVariable Long id) {
        return adminOrderService.getOrder(id);
    }

    // GET /api/admin/orders/{id}/history (상태 변경 이력)
    @GetMapping("/{id}/history")
    public List<OrderStatusHistoryResponse> getHistory(@PathVariable Long id) {
        return adminOrderService.getHistory(id);
    }

    // PATCH /api/admin/orders/{id}/status  { "status": "PACKING" | "SHIPPED" | "IN_TRANSIT" | "DELIVERED" | "RETURNED" }
    @PatchMapping("/{id}/status")
    public OrderResponse changeStatus(@AuthenticationPrincipal LoginUser loginUser,
                                      @PathVariable Long id,
                                      @Valid @RequestBody OrderStatusChangeRequest request) {
        return adminOrderService.changeStatus(id, request.status(), loginUser.id());
    }
}
