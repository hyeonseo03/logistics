package com.logistics.backend.shipment.repository;

import com.logistics.backend.shipment.entity.Shipment;
import com.logistics.backend.shipment.entity.ShipmentStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface ShipmentRepository extends JpaRepository<Shipment, Long> {

    Optional<Shipment> findByOrderId(Long orderId);

    @Query("select s from Shipment s join fetch s.warehouse where s.order.id in :orderIds")
    List<Shipment> findAllWithWarehouseByOrderIdIn(Collection<Long> orderIds);

    // 관리자 배송 목록 (최신 배송이 위로)
    @Query(value = "select s from Shipment s join fetch s.warehouse join fetch s.order order by s.id desc",
            countQuery = "select count(s) from Shipment s")
    Page<Shipment> findAllWithDetails(Pageable pageable);

    @Query(value = "select s from Shipment s join fetch s.warehouse join fetch s.order"
            + " where s.status = :status order by s.id desc",
            countQuery = "select count(s) from Shipment s where s.status = :status")
    Page<Shipment> findAllWithDetailsByStatus(ShipmentStatus status, Pageable pageable);
}
