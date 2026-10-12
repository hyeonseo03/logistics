package com.logistics.backend.inventory.controller;

import com.logistics.backend.inventory.dto.InventoryResponse;
import com.logistics.backend.inventory.service.InventoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class InventoryController {

    private final InventoryService inventoryService;

    // GET /api/inventories (관리자 재고 화면용 전체 목록)
    @GetMapping("/inventories")
    public List<InventoryResponse> getInventories() {
        return inventoryService.getInventories();
    }

    // GET /api/products/1/inventories (특정 상품의 물류센터별 재고)
    @GetMapping("/products/{productId}/inventories")
    public List<InventoryResponse> getInventoriesByProduct(@PathVariable Long productId) {
        return inventoryService.getInventoriesByProduct(productId);
    }
}
