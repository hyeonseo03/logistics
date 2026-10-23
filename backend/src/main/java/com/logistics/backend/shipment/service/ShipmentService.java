package com.logistics.backend.shipment.service;

import com.logistics.backend.global.dto.PageResponse;
import com.logistics.backend.global.exception.BusinessException;
import com.logistics.backend.global.exception.ErrorCode;
import com.logistics.backend.order.entity.Order;
import com.logistics.backend.order.entity.OrderStatus;
import com.logistics.backend.order.repository.OrderRepository;
import com.logistics.backend.shipment.dto.AdminShipmentResponse;
import com.logistics.backend.shipment.dto.EtaRequest;
import com.logistics.backend.shipment.dto.EtaResult;
import com.logistics.backend.shipment.dto.ShipmentEventResponse;
import com.logistics.backend.shipment.dto.ShipmentResponse;
import com.logistics.backend.shipment.dto.TrackingResponse;
import com.logistics.backend.shipment.entity.Shipment;
import com.logistics.backend.shipment.entity.ShipmentEvent;
import com.logistics.backend.shipment.entity.ShipmentStatus;
import com.logistics.backend.shipment.repository.ShipmentEventRepository;
import com.logistics.backend.shipment.repository.ShipmentRepository;
import com.logistics.backend.warehouse.entity.WarehouseRegion;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ShipmentService {

    private final ShipmentRepository shipmentRepository;
    private final ShipmentEventRepository eventRepository;
    private final OrderRepository orderRepository;
    private final EtaService etaService;

    // 주문이 만들어질 때 배송도 함께 만든다 (주문 트랜잭션 안에서 호출된다)
    @Transactional
    public Shipment createFor(Order order, LocalDateTime now) {
        Shipment shipment = shipmentRepository.save(new Shipment(order, order.getItems().get(0).getWarehouse()));
        eventRepository.save(new ShipmentEvent(shipment, ShipmentStatus.PREPARING,
                shipment.getWarehouse().getName(), "주문이 접수되어 상품을 준비하고 있습니다.", now));
        return shipment;
    }

    // 주문 상태가 바뀌면 배송 상태도 바꾸고 이력(shipment_events)을 자동으로 한 줄 남긴다
    // (OrderTransitionService 가 상태를 바꿀 때마다 호출한다)
    @Transactional
    public void recordStatusChange(Order order, OrderStatus next, LocalDateTime now) {
        Shipment shipment = shipmentRepository.findByOrderId(order.getId())
                .orElseGet(() -> shipmentRepository.save(new Shipment(order, order.getItems().get(0).getWarehouse())));

        ShipmentStatus status = ShipmentStatus.from(next);
        shipment.changeStatus(status, now);

        String warehouseName = shipment.getWarehouse().getName();
        String campName = WarehouseRegion.fromAddress(order.getAddress()).getLabel() + " 캠프";

        String location;
        String message;
        switch (next) {
            case PACKING -> {
                location = warehouseName;
                message = "상품을 포장하고 있습니다.";
            }
            case SHIPPED -> {
                location = warehouseName;
                message = "상품이 출고되었습니다. (운송장 " + shipment.getTrackingNumber() + ")";
            }
            case IN_TRANSIT -> {
                location = campName;
                message = "배송지 근처 캠프에 도착했습니다. 분류 후 배송을 시작합니다.";
            }
            case DELIVERED -> {
                location = order.getAddress();
                message = "배송이 완료되었습니다.";
            }
            case CANCELED -> {
                location = warehouseName;
                message = "주문이 취소되어 배송이 중단되었습니다.";
            }
            case RETURNING -> {
                location = order.getAddress();
                message = "회수 요청이 접수되었습니다. 기사님이 방문해 상품을 회수합니다.";
            }
            case RETURNED -> {
                location = warehouseName;
                message = "회수한 상품이 물류센터에 입고되었습니다.";
            }
            default -> {
                location = warehouseName;
                message = next.getLabel();
            }
        }
        eventRepository.save(new ShipmentEvent(shipment, status, location, message, now));
    }

    // GET /api/orders/{id}/tracking: 배송 타임라인 + 도착 예상 시각 (내 주문만)
    public TrackingResponse getTracking(Long userId, Long orderId) {
        Order order = orderRepository.findByIdAndUserId(orderId, userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.ORDER_NOT_FOUND));
        Shipment shipment = shipmentRepository.findByOrderId(orderId)
                .orElseThrow(() -> new BusinessException(ErrorCode.SHIPMENT_NOT_FOUND));

        List<ShipmentEventResponse> events = eventRepository.findTimeline(shipment.getId()).stream()
                .map(ShipmentEventResponse::from)
                .toList();

        return new TrackingResponse(
                order.getId(),
                order.getStatus(),
                order.getStatus().getLabel(),
                order.getReceiverName(),
                order.getAddress(),
                ShipmentResponse.from(shipment),
                events,
                estimate(order, shipment, LocalDateTime.now()).orElse(null)
        );
    }

    // GET /api/admin/shipments?status=SHIPPED&page=0&size=20
    public PageResponse<AdminShipmentResponse> getAdminShipments(ShipmentStatus status, int page, int size) {
        PageRequest pageable = PageRequest.of(page, size);
        Page<Shipment> shipments = (status == null)
                ? shipmentRepository.findAllWithDetails(pageable)
                : shipmentRepository.findAllWithDetailsByStatus(status, pageable);

        // 이 페이지 배송들의 이력을 한 번에 가져와서 배송별 "가장 최근 이력" 만 남긴다 (N+1 방지)
        List<Long> shipmentIds = shipments.getContent().stream().map(Shipment::getId).toList();
        Map<Long, ShipmentEventResponse> lastEventByShipmentId = new LinkedHashMap<>();
        if (!shipmentIds.isEmpty()) {
            for (ShipmentEvent event : eventRepository.findAllByShipmentIds(shipmentIds)) {
                lastEventByShipmentId.put(event.getShipment().getId(), ShipmentEventResponse.from(event)); // 오래된 순이라 마지막 값이 최신
            }
        }

        LocalDateTime now = LocalDateTime.now();
        List<AdminShipmentResponse> content = shipments.getContent().stream()
                .map(shipment -> AdminShipmentResponse.of(
                        ShipmentResponse.from(shipment),
                        shipment.getOrder(),
                        lastEventByShipmentId.get(shipment.getId()),
                        estimate(shipment.getOrder(), shipment, now).orElse(null)))
                .toList();
        return PageResponse.from(new PageImpl<>(content, pageable, shipments.getTotalElements()));
    }

    // 도착 예상 시각 (AI 도우미도 사용)
    public Optional<EtaResult> estimate(Order order, Shipment shipment, LocalDateTime now) {
        return etaService.estimate(new EtaRequest(
                order.getStatus(),
                order.getCreatedAt(),
                shipment.getShippedAt(),
                shipment.getInTransitAt(),
                shipment.getDeliveredAt(),
                shipment.getWarehouse().getRegion(),
                WarehouseRegion.fromAddress(order.getAddress()),
                now
        ));
    }
}
