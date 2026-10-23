package com.logistics.backend.inventory.repository;

import com.logistics.backend.inventory.dto.ProductStockTotal;
import com.logistics.backend.inventory.entity.Inventory;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

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

    // 판매가능재고가 기준보다 적은 재고 행 (관리자 대시보드 "품절 임박")
    @Query("select i from Inventory i join fetch i.product join fetch i.warehouse"
            + " where i.quantity - i.reservedQuantity < :threshold order by (i.quantity - i.reservedQuantity), i.id")
    List<Inventory> findLowStock(int threshold);

    // 관리자 재고 조정용: 이 행을 읽는 동안 다른 트랜잭션이 고치지 못하게 잠근다 (SELECT ... FOR UPDATE)
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select i from Inventory i where i.product.id = :productId and i.warehouse.id = :warehouseId")
    Optional<Inventory> findForUpdate(Long productId, Long warehouseId);

    // ───────── 재고 변경: 모두 "조건부 UPDATE 한 줄" 로 원자적으로 처리한다 ─────────
    // 읽고(SELECT) → 계산하고 → 쓰는(UPDATE) 사이에 다른 주문이 끼어들 틈이 없도록,
    // 조건 검사와 변경을 UPDATE 문 하나로 한다. 조건이 맞지 않으면 0 줄이 바뀐다 (= 재고 부족)
    // (bulk UPDATE 는 @PreUpdate 가 불리지 않으므로 updatedAt 도 직접 넣는다)

    // 주문: 판매가능재고(현재 - 예약)가 충분할 때만 예약재고를 늘린다
    @Modifying
    @Query("update Inventory i set i.reservedQuantity = i.reservedQuantity + :quantity, i.updatedAt = :now"
            + " where i.product.id = :productId and i.warehouse.id = :warehouseId"
            + " and i.quantity - i.reservedQuantity >= :quantity")
    int reserve(Long productId, Long warehouseId, int quantity, LocalDateTime now);

    // 출고 전 취소: 예약을 풀어 준다
    @Modifying
    @Query("update Inventory i set i.reservedQuantity = i.reservedQuantity - :quantity, i.updatedAt = :now"
            + " where i.product.id = :productId and i.warehouse.id = :warehouseId"
            + " and i.reservedQuantity >= :quantity")
    int release(Long productId, Long warehouseId, int quantity, LocalDateTime now);

    // 출고: 창고에서 실제로 나가므로 현재재고와 예약재고를 함께 줄인다
    @Modifying
    @Query("update Inventory i set i.quantity = i.quantity - :quantity,"
            + " i.reservedQuantity = i.reservedQuantity - :quantity, i.updatedAt = :now"
            + " where i.product.id = :productId and i.warehouse.id = :warehouseId"
            + " and i.reservedQuantity >= :quantity and i.quantity >= :quantity")
    int ship(Long productId, Long warehouseId, int quantity, LocalDateTime now);

    // 회수 완료: 돌아온 상품을 다시 현재재고에 더한다
    @Modifying
    @Query("update Inventory i set i.quantity = i.quantity + :quantity, i.updatedAt = :now"
            + " where i.product.id = :productId and i.warehouse.id = :warehouseId")
    int restock(Long productId, Long warehouseId, int quantity, LocalDateTime now);

    @Modifying
    @Query("delete from Inventory i where i.product.id = :productId")
    int deleteAllByProductId(Long productId);
}
