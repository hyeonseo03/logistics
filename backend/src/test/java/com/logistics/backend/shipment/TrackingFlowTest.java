package com.logistics.backend.shipment;

import com.jayway.jsonpath.JsonPath;
import com.logistics.backend.TestFixtures;
import com.logistics.backend.order.entity.OrderStatus;
import com.logistics.backend.order.service.OrderTransitionService;
import com.logistics.backend.product.entity.Product;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.UUID;

import static com.logistics.backend.TestAuth.signupAndLogin;
import static org.hamcrest.Matchers.startsWith;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@Import(TestFixtures.class)
class TrackingFlowTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private TestFixtures fixtures;
    @Autowired private OrderTransitionService transitionService;

    @Test
    void 상태가_바뀔때마다_배송이력이_쌓이고_예상도착시각을_알려준다() throws Exception {
        String token = signupAndLogin(mockMvc, "track-" + UUID.randomUUID() + "@example.com", "password123");
        Product product = fixtures.productWithStock(10000, 5);
        mockMvc.perform(post("/api/cart/items").header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"productId\":" + product.getId() + ",\"quantity\":1}"));
        String body = mockMvc.perform(post("/api/orders").header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON).content(TestFixtures.ORDER_BODY))
                .andExpect(jsonPath("$.shipment.status").value("PREPARING"))
                .andReturn().getResponse().getContentAsString();
        long orderId = ((Integer) JsonPath.read(body, "$.id")).longValue();

        transitionService.changeStatus(orderId, OrderStatus.PACKING, null);
        transitionService.changeStatus(orderId, OrderStatus.SHIPPED, null);

        mockMvc.perform(get("/api/orders/" + orderId + "/tracking").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.orderStatus").value("SHIPPED"))
                .andExpect(jsonPath("$.shipment.trackingNumber").value(startsWith("LG")))
                .andExpect(jsonPath("$.events.length()").value(3)) // 접수, 포장, 출고
                .andExpect(jsonPath("$.events[0].status").value("PREPARING"))
                .andExpect(jsonPath("$.events[2].status").value("SHIPPED"))
                .andExpect(jsonPath("$.events[2].location").value("서울 물류센터"))
                .andExpect(jsonPath("$.eta.method").value("RULE_BASED"))
                .andExpect(jsonPath("$.eta.estimatedArrivalAt").exists())
                .andExpect(jsonPath("$.eta.steps.length()").value(3));

        // 출고 후 취소 → 회수중: 이력은 남고 예상 시각은 없다
        mockMvc.perform(post("/api/orders/" + orderId + "/cancel").header("Authorization", "Bearer " + token));
        mockMvc.perform(get("/api/orders/" + orderId + "/tracking").header("Authorization", "Bearer " + token))
                .andExpect(jsonPath("$.events.length()").value(4))
                .andExpect(jsonPath("$.events[3].status").value("RETURNING"))
                .andExpect(jsonPath("$.eta").doesNotExist());
    }
}
