package com.logistics.backend.inventory.repository;

import com.logistics.backend.inventory.dto.ProductStockTotal;
import com.logistics.backend.inventory.entity.Inventory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface InventoryRepository extends JpaRepository<Inventory, Long> {

    // join fetch: 재고를 가져올 때 상품·물류센터도 한 번의 SQL로 같이 가져온다 (상품명, 센터명 응답용)
    @Query("select i from Inventory i join fetch i.product join fetch i.warehouse order by i.id")
    List<Inventory> findAllWithProductAndWarehouse();

    @Query("select i from Inventory i join fetch i.product join fetch i.warehouse"
            + " where i.product.id = :productId order by i.warehouse.id")
    List<Inventory> findAllWithProductAndWarehouseByProductId(Long productId);

    // 상품별 판매가능재고 합계를 SQL 한 번(group by)으로 구한다
    // 판매가능재고 = 현재재고 - 예약재고, 음수면 0 (프론트 lib/stock.ts 의 getAvailableQuantity 와 같은 규칙)
    @Query("select new com.logistics.backend.inventory.dto.ProductStockTotal("
            + " i.product.id,"
            + " sum(case when i.quantity > i.reservedQuantity then i.quantity - i.reservedQuantity else 0 end))"
            + " from Inventory i group by i.product.id")
    List<ProductStockTotal> sumTotalStockGroupByProduct();

    @Query("select coalesce(sum(case when i.quantity > i.reservedQuantity then i.quantity - i.reservedQuantity else 0 end), 0)"
            + " from Inventory i where i.product.id = :productId")
    long sumTotalStockByProductId(Long productId);
}
