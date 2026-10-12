package com.logistics.backend.warehouse.controller;

import com.logistics.backend.warehouse.dto.WarehouseResponse;
import com.logistics.backend.warehouse.service.WarehouseService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/warehouses")
@RequiredArgsConstructor
public class WarehouseController {

    private final WarehouseService warehouseService;

    // GET /api/warehouses
    @GetMapping
    public List<WarehouseResponse> getWarehouses() {
        return warehouseService.getWarehouses();
    }
}
