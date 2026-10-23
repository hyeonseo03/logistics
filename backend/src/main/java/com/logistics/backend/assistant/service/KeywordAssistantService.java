package com.logistics.backend.assistant.service;

import com.logistics.backend.assistant.dto.AssistantData.CancelData;
import com.logistics.backend.assistant.dto.AssistantData.EtaData;
import com.logistics.backend.assistant.dto.AssistantData.HelpData;
import com.logistics.backend.assistant.dto.AssistantData.OrderStatusData;
import com.logistics.backend.assistant.dto.AssistantReplyType;
import com.logistics.backend.assistant.dto.AssistantResponse;
import com.logistics.backend.order.dto.CancelInfo;
import com.logistics.backend.order.entity.Order;
import com.logistics.backend.order.entity.OrderItem;
import com.logistics.backend.order.entity.OrderStatus;
import com.logistics.backend.order.repository.OrderRepository;
import com.logistics.backend.product.dto.ProductResponse;
import com.logistics.backend.product.service.ProductService;
import com.logistics.backend.shipment.dto.EtaResult;
import com.logistics.backend.shipment.entity.Shipment;
import com.logistics.backend.shipment.entity.ShipmentEvent;
import com.logistics.backend.shipment.repository.ShipmentEventRepository;
import com.logistics.backend.shipment.repository.ShipmentRepository;
import com.logistics.backend.shipment.service.ShipmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.EnumSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.function.Function;

// 키워드 기반 AI 도우미 (외부 AI API 키 없이 동작)
//
// 질문에 들어 있는 단어로 의도를 고르고, 실제 DB 데이터로 답한다. 위에서부터 먼저 걸리는 규칙을 쓴다
//   1) "취소", "환불", "반품"        → 최근 주문을 지금 취소하면 어떻게 되는지 (실제로 취소하지는 않는다)
//   2) "언제", "도착", "몇 시"       → 최근 주문의 도착 예상 시각 (EtaService)
//   3) "주문", "배송", "어디", "택배" → 최근 주문의 배송 상태
//   4) 상품 이름에 있는 단어          → 상품 검색 결과
//   5) 그 외                         → 사용 안내
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class KeywordAssistantService implements AssistantService {

    private static final List<String> CANCEL_KEYWORDS = List.of("취소", "환불", "반품");
    private static final List<String> ETA_KEYWORDS = List.of("언제", "도착", "몇 시", "몇시");
    private static final List<String> ORDER_KEYWORDS = List.of("주문", "배송", "어디", "택배");

    // 도착 예정을 물을 때 대상이 되는 "진행 중" 주문
    private static final Set<OrderStatus> IN_PROGRESS = EnumSet.of(
            OrderStatus.ORDERED, OrderStatus.PACKING, OrderStatus.SHIPPED, OrderStatus.IN_TRANSIT);

    private static final List<String> EXAMPLES = List.of(
            "내 주문 어디쯤이야?", "언제 도착해?", "주문 취소하면 어떻게 돼?", "감귤 있어?");

    private final OrderRepository orderRepository;
    private final ShipmentRepository shipmentRepository;
    private final ShipmentEventRepository eventRepository;
    private final ShipmentService shipmentService;
    private final ProductService productService;

    @Override
    public AssistantResponse chat(Long userId, String message) {
        String text = message.trim();

        if (containsAny(text, CANCEL_KEYWORDS)) {
            return withLatestOrder(userId, this::answerCancel);
        }
        if (containsAny(text, ETA_KEYWORDS)) {
            return withLatestOrder(userId, this::answerEta);
        }
        if (containsAny(text, ORDER_KEYWORDS)) {
            return withLatestOrder(userId, this::answerOrderStatus);
        }

        List<ProductResponse> products = searchProducts(text);
        if (!products.isEmpty()) {
            return answerProducts(products);
        }
        return help();
    }

    // ───────── 의도별 답변 ─────────

    private AssistantResponse answerOrderStatus(List<Order> orders) {
        Order order = orders.get(0);
        Optional<Shipment> shipment = shipmentRepository.findByOrderId(order.getId());
        Optional<ShipmentEvent> lastEvent = shipment.flatMap(s -> lastOf(eventRepository.findTimeline(s.getId())));

        String where = lastEvent.map(e -> " (" + e.getLocation() + ": " + e.getMessage() + ")").orElse("");
        String reply = String.format("가장 최근 주문 %d번 [%s]은(는) 지금 '%s' 상태예요.%s",
                order.getId(), summary(order), order.getStatus().getLabel(), where);

        OrderStatusData data = new OrderStatusData(
                order.getId(), summary(order), order.getStatus(), order.getStatus().getLabel(),
                shipment.map(Shipment::getTrackingNumber).orElse(null),
                lastEvent.map(ShipmentEvent::getLocation).orElse(null),
                lastEvent.map(ShipmentEvent::getMessage).orElse(null));
        return new AssistantResponse(reply, AssistantReplyType.ORDER_STATUS, data);
    }

    private AssistantResponse answerEta(List<Order> orders) {
        // 진행 중인 주문이 있으면 그것을, 없으면 가장 최근 주문을 본다
        Order order = orders.stream().filter(o -> IN_PROGRESS.contains(o.getStatus())).findFirst().orElse(orders.get(0));
        Optional<EtaResult> eta = shipmentRepository.findByOrderId(order.getId())
                .flatMap(s -> shipmentService.estimate(order, s, LocalDateTime.now()));

        String reply = eta
                .map(e -> String.format("주문 %d번 [%s]: %s", order.getId(), summary(order), e.message()))
                .orElse(String.format("주문 %d번 [%s]은(는) '%s' 상태라 도착 예정 시각이 없어요.",
                        order.getId(), summary(order), order.getStatus().getLabel()));
        return new AssistantResponse(reply, AssistantReplyType.ETA,
                new EtaData(order.getId(), summary(order), eta.orElse(null)));
    }

    private AssistantResponse answerCancel(List<Order> orders) {
        // 취소할 수 있는 주문이 있으면 그것을, 없으면 가장 최근 주문을 본다
        Order order = orders.stream().filter(o -> o.getStatus().cancelType().isCancelable()).findFirst().orElse(orders.get(0));
        CancelInfo cancelInfo = CancelInfo.from(order.getStatus());

        String reply = String.format("주문 %d번 [%s]은(는) 지금 '%s' 상태예요. %s%s",
                order.getId(), summary(order), order.getStatus().getLabel(), cancelInfo.message(),
                cancelInfo.cancelable() ? " 취소는 주문 내역에서 '취소' 버튼으로 할 수 있어요." : "");
        return new AssistantResponse(reply, AssistantReplyType.CANCEL_INFO,
                new CancelData(order.getId(), summary(order), order.getStatus(), cancelInfo));
    }

    private AssistantResponse answerProducts(List<ProductResponse> products) {
        StringBuilder reply = new StringBuilder("찾으시는 상품이 있어요.\n");
        for (ProductResponse product : products) {
            String stock = product.totalStock() > 0 ? "구매 가능" : "품절";
            reply.append(String.format("- %s %,d원 (%s)%n", product.name(), product.price(), stock));
        }
        return new AssistantResponse(reply.toString().trim(), AssistantReplyType.PRODUCT_SEARCH, products);
    }

    private AssistantResponse help() {
        String reply = "이렇게 물어보세요.\n- " + String.join("\n- ", EXAMPLES);
        return new AssistantResponse(reply, AssistantReplyType.HELP, new HelpData(EXAMPLES));
    }

    // ───────── 도우미 메서드 ─────────

    // 로그인과 주문 내역이 필요한 질문의 공통 처리
    private AssistantResponse withLatestOrder(Long userId, Function<List<Order>, AssistantResponse> answer) {
        if (userId == null) {
            return new AssistantResponse("로그인하시면 주문하신 상품의 배송 현황을 알려드릴게요.",
                    AssistantReplyType.LOGIN_REQUIRED, null);
        }
        List<Order> orders = orderRepository.findAllByUserIdOrderByLatest(userId); // 최신순
        if (orders.isEmpty()) {
            return new AssistantResponse("아직 주문하신 상품이 없어요.", AssistantReplyType.NO_ORDER, null);
        }
        return answer.apply(orders);
    }

    // 상품 이름을 단어로 나눠서(예: "제주 감귤 3kg" → 제주, 감귤, 3kg) 그중 하나라도 질문에 들어 있으면 찾은 것으로 본다
    private List<ProductResponse> searchProducts(String text) {
        return productService.getProducts(null).stream()
                .filter(product -> Arrays.stream(product.name().split("\\s+"))
                        .filter(word -> word.length() >= 2)
                        .anyMatch(text::contains))
                .limit(5)
                .toList();
    }

    // "제주 감귤 3kg 외 1건"
    private String summary(Order order) {
        List<OrderItem> items = order.getItems();
        if (items.isEmpty()) {
            return "상품 없음";
        }
        String first = items.get(0).getProduct().getName();
        return items.size() == 1 ? first : first + " 외 " + (items.size() - 1) + "건";
    }

    private boolean containsAny(String text, List<String> keywords) {
        return keywords.stream().anyMatch(text::contains);
    }

    private <T> Optional<T> lastOf(List<T> list) {
        return list.isEmpty() ? Optional.empty() : Optional.of(list.get(list.size() - 1));
    }
}
