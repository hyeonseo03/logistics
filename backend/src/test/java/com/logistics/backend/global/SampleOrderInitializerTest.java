package com.logistics.backend.global;

import com.logistics.backend.global.init.SampleOrderInitializer;
import com.logistics.backend.inventory.repository.InventoryRepository;
import com.logistics.backend.order.entity.Order;
import com.logistics.backend.order.entity.OrderStatus;
import com.logistics.backend.order.repository.OrderRepository;
import com.logistics.backend.shipment.repository.ShipmentEventRepository;
import com.logistics.backend.shipment.repository.ShipmentRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

// 샘플 주문 데이터가 실제 서비스 규칙대로 만들어지는지 확인한다
// (다른 테스트와 섞이지 않게 별도의 메모리 DB 이름을 쓴다)
@SpringBootTest(properties = {
        "app.sample-data.enabled=true",
        "spring.datasource.url=jdbc:h2:mem:sampledb;MODE=PostgreSQL;DATABASE_TO_LOWER=TRUE;DEFAULT_NULL_ORDERING=HIGH"
})
class SampleOrderInitializerTest {

    @Autowired private OrderRepository orderRepository;
    @Autowired private ShipmentRepository shipmentRepository;
    @Autowired private ShipmentEventRepository eventRepository;
    @Autowired private InventoryRepository inventoryRepository;
    @Autowired private SampleOrderInitializer initializer;

    @Test
    void 비어_있을_때만_샘플_주문과_배송을_만든다() {
        List<Order> orders = orderRepository.findAll();
        assertThat(orders).hasSize(8);
        assertThat(orders).extracting(Order::getStatus).contains(
                OrderStatus.ORDERED, OrderStatus.PACKING, OrderStatus.SHIPPED, OrderStatus.IN_TRANSIT,
                OrderStatus.DELIVERED, OrderStatus.CANCELED, OrderStatus.RETURNING, OrderStatus.RETURNED);

        // 주문마다 배송과 배송 이력이 있다 (배송완료 주문은 접수·포장·출고·배송중·배송완료 5줄 이상)
        assertThat(shipmentRepository.count()).isEqualTo(8);
        assertThat(eventRepository.count()).isGreaterThan(20);

        // 예약재고가 음수가 되는 등 재고가 깨지지 않았다
        assertThat(inventoryRepository.findAll()).allSatisfy(inventory -> {
            assertThat(inventory.getQuantity()).isGreaterThanOrEqualTo(0);
            assertThat(inventory.getReservedQuantity()).isBetween(0, inventory.getQuantity());
        });

        // 한 번 더 실행해도 늘어나지 않는다
        initializer.run();
        assertThat(orderRepository.count()).isEqualTo(8);
    }
}
