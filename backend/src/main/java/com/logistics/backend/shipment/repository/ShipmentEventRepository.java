package com.logistics.backend.shipment.repository;

import com.logistics.backend.shipment.entity.ShipmentEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.Collection;
import java.util.List;

public interface ShipmentEventRepository extends JpaRepository<ShipmentEvent, Long> {

    // 타임라인: 오래된 순서
    @Query("select e from ShipmentEvent e where e.shipment.id = :shipmentId order by e.occurredAt asc, e.id asc")
    List<ShipmentEvent> findTimeline(Long shipmentId);

    // 여러 배송의 이력을 한 번에 (관리자 목록에서 "가장 최근 이력" 을 고를 때)
    @Query("select e from ShipmentEvent e where e.shipment.id in :shipmentIds order by e.occurredAt asc, e.id asc")
    List<ShipmentEvent> findAllByShipmentIds(Collection<Long> shipmentIds);
}
