package com.logistics.backend.shipment.controller;

import com.logistics.backend.global.dto.PageResponse;
import com.logistics.backend.shipment.dto.AdminShipmentResponse;
import com.logistics.backend.shipment.entity.ShipmentStatus;
import com.logistics.backend.shipment.service.ShipmentService;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

// 관리자 배송 목록 (배송 상태 변경은 주문 상태 변경 API 로 한다: PATCH /api/admin/orders/{id}/status)
@RestController
@RequestMapping("/api/admin/shipments")
@RequiredArgsConstructor
public class AdminShipmentController {

    private final ShipmentService shipmentService;

    // GET /api/admin/shipments?status=IN_TRANSIT&page=0&size=20
    @GetMapping
    public PageResponse<AdminShipmentResponse> getShipments(@RequestParam(required = false) ShipmentStatus status,
                                                            @RequestParam(defaultValue = "0") @Min(0) int page,
                                                            @RequestParam(defaultValue = "20") @Min(1) @Max(100) int size) {
        return shipmentService.getAdminShipments(status, page, size);
    }
}
