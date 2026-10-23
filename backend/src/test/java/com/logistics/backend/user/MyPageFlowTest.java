package com.logistics.backend.user;

import com.jayway.jsonpath.JsonPath;
import com.logistics.backend.TestAuth;
import com.logistics.backend.TestFixtures;
import com.logistics.backend.product.entity.Product;
import com.logistics.backend.user.entity.Role;
import com.logistics.backend.user.entity.User;
import com.logistics.backend.user.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;

import java.util.UUID;

import static com.logistics.backend.TestAuth.signupAndLogin;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

// 마이페이지에 새로 추가한 API: 재입고 알림, 취소·회수 내역, 관리자 통계
@SpringBootTest
@AutoConfigureMockMvc
@Import(TestFixtures.class)
class MyPageFlowTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private TestFixtures fixtures;
    @Autowired private UserRepository userRepository;
    @Autowired private PasswordEncoder passwordEncoder;

    @Test
    void 재입고_알림_신청_목록_해제() throws Exception {
        String token = signupAndLogin(mockMvc, "user-" + UUID.randomUUID() + "@example.com", "password123");
        Product product = fixtures.productWithStock(10000, 0); // 품절 상품

        // 로그인 없이 신청 → 401
        mockMvc.perform(post("/api/products/" + product.getId() + "/restock-alerts"))
                .andExpect(status().isUnauthorized());

        // 신청 (두 번 눌러도 한 건)
        String body = mockMvc.perform(post("/api/products/" + product.getId() + "/restock-alerts").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.productId").value(product.getId()))
                .andExpect(jsonPath("$.product.totalStock").value(0))
                .andReturn().getResponse().getContentAsString();
        int alertId = JsonPath.read(body, "$.id");
        mockMvc.perform(post("/api/products/" + product.getId() + "/restock-alerts").header("Authorization", "Bearer " + token))
                .andExpect(jsonPath("$.id").value(alertId));

        mockMvc.perform(get("/api/users/me/restock-alerts").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].product.name").value(product.getName()));

        // 다른 회원은 내 알림을 지울 수 없다 → 404
        String other = signupAndLogin(mockMvc, "user-" + UUID.randomUUID() + "@example.com", "password123");
        mockMvc.perform(delete("/api/users/me/restock-alerts/" + alertId).header("Authorization", "Bearer " + other))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("RESTOCK_ALERT_NOT_FOUND"));

        mockMvc.perform(delete("/api/users/me/restock-alerts/" + alertId).header("Authorization", "Bearer " + token))
                .andExpect(status().isNoContent());
        mockMvc.perform(get("/api/users/me/restock-alerts").header("Authorization", "Bearer " + token))
                .andExpect(jsonPath("$.length()").value(0));
    }

    @Test
    void 취소_내역과_회수_내역() throws Exception {
        String token = signupAndLogin(mockMvc, "user-" + UUID.randomUUID() + "@example.com", "password123");
        String adminToken = adminToken();
        Product product = fixtures.productWithStock(10000, 50);

        // 주문 1: 출고 전 취소 → 취소 내역
        int canceledOrderId = order(token, product);
        mockMvc.perform(post("/api/orders/" + canceledOrderId + "/cancel").header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON).content("{\"reason\":\"단순 변심\"}"))
                .andExpect(jsonPath("$.result").value("CANCELED"));

        // 주문 2: 출고 후 취소 → 회수 내역 (회수중 → 관리자 회수 완료)
        int returnedOrderId = order(token, product);
        changeStatus(adminToken, returnedOrderId, "PACKING");
        changeStatus(adminToken, returnedOrderId, "SHIPPED");
        mockMvc.perform(post("/api/orders/" + returnedOrderId + "/cancel").header("Authorization", "Bearer " + token))
                .andExpect(jsonPath("$.result").value("RETURN_REQUESTED"));

        mockMvc.perform(get("/api/users/me/claims?type=CANCEL").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].orderId").value(canceledOrderId))
                .andExpect(jsonPath("$[0].status").value("COMPLETED"))
                .andExpect(jsonPath("$[0].reason").value("단순 변심"))
                .andExpect(jsonPath("$[0].order.items[0].categoryName").exists());

        mockMvc.perform(get("/api/users/me/claims?type=RETURN").header("Authorization", "Bearer " + token))
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].orderId").value(returnedOrderId))
                .andExpect(jsonPath("$[0].status").value("IN_PROGRESS"));

        changeStatus(adminToken, returnedOrderId, "RETURNED");
        mockMvc.perform(get("/api/users/me/claims?type=RETURN").header("Authorization", "Bearer " + token))
                .andExpect(jsonPath("$[0].status").value("COMPLETED"))
                .andExpect(jsonPath("$[0].completedAt").exists());

        // 관리자 통계: 취소·회수 건수와 일별 매출(14일)
        mockMvc.perform(get("/api/admin/analytics").header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.dailySales.length()").value(14))
                .andExpect(jsonPath("$.canceledOrders").isNumber())
                .andExpect(jsonPath("$.returnedOrders").isNumber())
                .andExpect(jsonPath("$.categorySales").isArray())
                .andExpect(jsonPath("$.topProducts").isArray());

        // 일반 회원은 통계를 볼 수 없다
        mockMvc.perform(get("/api/admin/analytics").header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden());
    }

    private int order(String token, Product product) throws Exception {
        mockMvc.perform(post("/api/cart/items").header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"productId\":" + product.getId() + ",\"quantity\":1}"))
                .andExpect(status().isOk());
        String body = mockMvc.perform(post("/api/orders").header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON).content(TestFixtures.ORDER_BODY))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        return JsonPath.read(body, "$.id");
    }

    private void changeStatus(String adminToken, int orderId, String status) throws Exception {
        mockMvc.perform(patch("/api/admin/orders/" + orderId + "/status").header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON).content("{\"status\":\"" + status + "\"}"))
                .andExpect(status().isOk());
    }

    private String adminToken() throws Exception {
        String email = "admin-" + UUID.randomUUID() + "@example.com";
        userRepository.save(new User(email, passwordEncoder.encode("admin-password"), "관리자", "010-0000-0000", Role.ADMIN));
        return TestAuth.login(mockMvc, email, "admin-password");
    }
}
