package com.logistics.backend.warehouse.controller;

import com.logistics.backend.warehouse.dto.WarehouseResponse;
import com.logistics.backend.warehouse.service.WarehouseService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

// 관리자 물류센터 목록
@RestController
@RequestMapping("/api/admin/warehouses")
@RequiredArgsConstructor
public class AdminWarehouseController {

    private final WarehouseService warehouseService;

    @GetMapping
    public List<WarehouseResponse> getWarehouses() {
        return warehouseService.getWarehouses();
    }
}
