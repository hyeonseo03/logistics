package com.logistics.backend;

import com.logistics.backend.category.repository.CategoryRepository;
import com.logistics.backend.inventory.entity.Inventory;
import com.logistics.backend.inventory.repository.InventoryRepository;
import com.logistics.backend.product.entity.Product;
import com.logistics.backend.product.repository.ProductRepository;
import com.logistics.backend.warehouse.entity.Warehouse;
import com.logistics.backend.warehouse.entity.WarehouseRegion;
import com.logistics.backend.warehouse.repository.WarehouseRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.test.context.TestComponent;

import java.time.LocalDateTime;
import java.util.UUID;

// 테스트마다 새 상품·재고를 만들어서, 다른 테스트나 샘플 데이터와 섞이지 않게 한다
@TestComponent
@RequiredArgsConstructor
public class TestFixtures {

    // 직접 입력 배송지로 주문하는 요청 본문 (서울 → 서울 물류센터에서 출고)
    public static final String ORDER_BODY = "{\"receiverName\":\"홍길동\",\"receiverPhone\":\"010-1111-2222\","
            + "\"address\":\"서울시 강남구 테헤란로 1\",\"paymentMethod\":\"CARD\"}";

    private final CategoryRepository categoryRepository;
    private final ProductRepository productRepository;
    private final WarehouseRepository warehouseRepository;
    private final InventoryRepository inventoryRepository;

    // 서울 물류센터에 quantity 개 있는 새 상품
    public Product productWithStock(int price, int quantity) {
        Product product = productRepository.save(new Product(
                categoryRepository.findAll().get(0),
                "테스트상품-" + UUID.randomUUID().toString().substring(0, 8),
                "테스트용 상품", price, null, null, LocalDateTime.now()));
        inventoryRepository.save(new Inventory(product, warehouse(WarehouseRegion.SEOUL), quantity, 0));
        return product;
    }

    public Warehouse warehouse(WarehouseRegion region) {
        return warehouseRepository.findAll().stream()
                .filter(w -> w.getRegion() == region)
                .findFirst().orElseThrow();
    }

    public Inventory inventory(Product product) {
        return inventoryRepository.findAll().stream()
                .filter(i -> i.getProduct().getId().equals(product.getId()))
                .findFirst().orElseThrow();
    }

    public void setQuantity(Product product, int quantity) {
        Inventory inventory = inventory(product);
        inventory.changeQuantity(quantity);
        inventoryRepository.save(inventory);
    }
}
