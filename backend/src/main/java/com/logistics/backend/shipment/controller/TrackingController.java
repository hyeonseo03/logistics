package com.logistics.backend.shipment.controller;

import com.logistics.backend.global.security.LoginUser;
import com.logistics.backend.shipment.dto.TrackingResponse;
import com.logistics.backend.shipment.service.ShipmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

// 배송 조회 (로그인 필요, 내 주문만)
@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
public class TrackingController {

    private final ShipmentService shipmentService;

    // GET /api/orders/{id}/tracking
    @GetMapping("/{id}/tracking")
    public TrackingResponse getTracking(@AuthenticationPrincipal LoginUser loginUser, @PathVariable Long id) {
        return shipmentService.getTracking(loginUser.id(), id);
    }
}
