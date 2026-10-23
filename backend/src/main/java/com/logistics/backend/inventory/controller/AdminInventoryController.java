package com.logistics.backend.inventory.controller;

import com.logistics.backend.inventory.dto.InventoryAdjustRequest;
import com.logistics.backend.inventory.dto.InventoryResponse;
import com.logistics.backend.inventory.service.InventoryService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

// 관리자 재고 관리
@RestController
@RequestMapping("/api/admin/inventories")
@RequiredArgsConstructor
public class AdminInventoryController {

    private final InventoryService inventoryService;

    @GetMapping
    public List<InventoryResponse> getInventories() {
        return inventoryService.getInventories();
    }

    // PUT /api/admin/inventories  { "productId": 1, "warehouseId": 2, "quantity": 50 }
    @PutMapping
    public InventoryResponse adjust(@Valid @RequestBody InventoryAdjustRequest request) {
        return inventoryService.adjust(request);
    }
}
