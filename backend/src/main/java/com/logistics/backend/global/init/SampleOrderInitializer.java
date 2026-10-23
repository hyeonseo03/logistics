package com.logistics.backend.global.init;

import com.logistics.backend.cart.entity.CartItem;
import com.logistics.backend.cart.repository.CartItemRepository;
import com.logistics.backend.order.dto.CreateOrderRequest;
import com.logistics.backend.order.dto.OrderResponse;
import com.logistics.backend.order.entity.OrderStatus;
import com.logistics.backend.order.entity.PaymentMethod;
import com.logistics.backend.order.repository.OrderRepository;
import com.logistics.backend.order.service.OrderService;
import com.logistics.backend.order.service.OrderTransitionService;
import com.logistics.backend.product.entity.Product;
import com.logistics.backend.product.repository.ProductRepository;
import com.logistics.backend.user.entity.Role;
import com.logistics.backend.user.entity.User;
import com.logistics.backend.user.entity.UserAddress;
import com.logistics.backend.user.repository.UserAddressRepository;
import com.logistics.backend.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.core.annotation.Order;
import org.springframework.data.domain.Sort;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

// 샘플 주문·배송 데이터. orders 테이블이 비어 있을 때만 한 번 넣는다 (관리자 대시보드·배송 목록 확인용)
//
// 주문은 실제 서비스(OrderService, OrderTransitionService)를 그대로 거쳐 만든다.
// 그래서 재고 예약·출고 차감·환불·배송 이력이 실제 주문과 똑같이 맞춰진다. (시각만 과거로 지정)
//
// 샘플 고객 2명은 비밀번호를 무작위로 만들어서 로그인할 수 없다. 화면 확인은 직접 회원가입해서 하면 된다
@Slf4j
@Component
@Order(3) // 관리자(1) → 상품·재고(2) 다음에 실행
@ConditionalOnProperty(name = "app.sample-data.enabled", havingValue = "true", matchIfMissing = true)
@RequiredArgsConstructor
public class SampleOrderInitializer implements CommandLineRunner {

    private final OrderRepository orderRepository;
    private final OrderService orderService;
    private final OrderTransitionService transitionService;
    private final UserRepository userRepository;
    private final UserAddressRepository addressRepository;
    private final ProductRepository productRepository;
    private final CartItemRepository cartItemRepository;
    private final PasswordEncoder passwordEncoder;

    // 주문 하나의 샘플: 누가, 무엇을 몇 개, 며칠 전 몇 시에, 최종 상태
    private record Sample(User user, Map<Product, Integer> items, int daysAgo, int hour, OrderStatus finalStatus) {
    }

    @Override
    public void run(String... args) {
        if (orderRepository.count() > 0) {
            return;
        }

        List<Product> products = productRepository.findAll(Sort.by("id"));
        if (products.size() < 12) {
            log.warn("샘플 상품이 없어 샘플 주문을 만들지 않았습니다.");
            return;
        }
        Product tangerine = products.get(0);  // 제주 감귤 (부산)
        Product rice = products.get(1);       // 유기농 현미 (경기·부산)
        Product coldBrew = products.get(2);   // 콜드브루 (서울)
        Product tissue = products.get(4);     // 롤화장지 (경기·부산)
        Product tumbler = products.get(6);    // 텀블러 (서울·부산)
        Product tshirt = products.get(10);    // 반팔 티셔츠 (부산)

        User seoul = sampleCustomer("sample1@logistics.local", "김민지", "010-1234-5678", "서울시 강남구 테헤란로 123");
        User busan = sampleCustomer("sample2@logistics.local", "이준호", "010-2345-6789", "부산시 해운대구 센텀로 45");

        List<Sample> samples = List.of(
                new Sample(seoul, Map.of(tissue, 2, coldBrew, 1), 6, 10, OrderStatus.DELIVERED),
                new Sample(seoul, Map.of(rice, 1), 5, 9, OrderStatus.RETURNING),   // 배송완료 후 회수 요청
                new Sample(seoul, Map.of(rice, 1), 4, 14, OrderStatus.RETURNED),   // 회수 완료 (재고 복구·환불)
                new Sample(busan, Map.of(coldBrew, 1), 3, 11, OrderStatus.CANCELED),
                new Sample(busan, Map.of(tangerine, 1), 2, 9, OrderStatus.IN_TRANSIT),
                new Sample(busan, Map.of(tshirt, 2), 1, 20, OrderStatus.SHIPPED),
                new Sample(seoul, Map.of(tumbler, 1), 0, -3, OrderStatus.PACKING),  // 오늘, 3시간 전
                new Sample(seoul, Map.of(tissue, 1), 0, -1, OrderStatus.ORDERED)    // 오늘, 1시간 전
        );

        int created = 0;
        for (Sample sample : samples) {
            try {
                createSample(sample);
                created++;
            } catch (RuntimeException e) {
                // 샘플 하나가 실패해도(예: 재고를 미리 바꿔 둔 경우) 서버는 정상적으로 뜨게 한다
                log.warn("샘플 주문을 만들지 못했습니다: {}", e.getMessage());
            }
        }
        log.info("샘플 주문 {}건을 만들었습니다.", created);
    }

    private void createSample(Sample sample) {
        // 음수 hour 는 "지금으로부터 몇 시간 전"
        LocalDateTime orderedAt = (sample.hour() < 0)
                ? LocalDateTime.now().plusHours(sample.hour())
                : LocalDate.now().minusDays(sample.daysAgo()).atTime(sample.hour(), 0);

        sample.items().forEach((product, quantity) ->
                cartItemRepository.save(new CartItem(sample.user(), product, quantity)));

        PaymentMethod method = (sample.daysAgo() % 2 == 0) ? PaymentMethod.CARD : PaymentMethod.BANK_TRANSFER;
        OrderResponse order = orderService.createOrder(sample.user().getId(),
                new CreateOrderRequest(addressIdOf(sample.user()), null, null, null, method, null), orderedAt);

        for (Step step : stepsTo(sample.finalStatus())) {
            transitionService.changeStatus(order.id(), step.status(), null, orderedAt.plusMinutes(step.minutesAfterOrder()));
        }
    }

    private record Step(OrderStatus status, int minutesAfterOrder) {
    }

    // 최종 상태까지 거쳐 가는 단계와 시각 (주문 시각으로부터 몇 분 뒤)
    private List<Step> stepsTo(OrderStatus finalStatus) {
        Step packing = new Step(OrderStatus.PACKING, 60);
        Step shipped = new Step(OrderStatus.SHIPPED, 120);
        Step inTransit = new Step(OrderStatus.IN_TRANSIT, 190);
        Step delivered = new Step(OrderStatus.DELIVERED, 300);
        return switch (finalStatus) {
            case ORDERED -> List.of();
            case PACKING -> List.of(packing);
            case SHIPPED -> List.of(packing, shipped);
            case IN_TRANSIT -> List.of(packing, shipped, inTransit);
            case DELIVERED -> List.of(packing, shipped, inTransit, delivered);
            case CANCELED -> List.of(new Step(OrderStatus.CANCELED, 30));
            case RETURNING -> List.of(packing, shipped, inTransit, delivered, new Step(OrderStatus.RETURNING, 60 * 24));
            case RETURNED -> List.of(packing, shipped, inTransit, delivered,
                    new Step(OrderStatus.RETURNING, 60 * 24), new Step(OrderStatus.RETURNED, 60 * 48));
        };
    }

    private User sampleCustomer(String email, String name, String phone, String address) {
        return userRepository.findByEmail(email).orElseGet(() -> {
            // 비밀번호를 무작위 값으로 만든다 → 이 계정으로는 로그인할 수 없다 (코드에 비밀번호를 남기지 않기 위해)
            User user = userRepository.save(new User(email, passwordEncoder.encode(UUID.randomUUID().toString()),
                    name, phone, Role.USER));
            UserAddress home = new UserAddress(user, "집", name, phone, address);
            home.setDefault(true);
            addressRepository.save(home);
            return user;
        });
    }

    private Long addressIdOf(User user) {
        return addressRepository.findAllByUserIdOrderByDefault(user.getId()).get(0).getId();
    }
}
