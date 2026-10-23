package com.logistics.backend.admin;

import com.jayway.jsonpath.JsonPath;
import com.logistics.backend.TestAuth;
import com.logistics.backend.TestFixtures;
import com.logistics.backend.product.entity.Product;
import com.logistics.backend.user.entity.Role;
import com.logistics.backend.user.entity.User;
import com.logistics.backend.user.repository.UserRepository;
import com.logistics.backend.warehouse.entity.WarehouseRegion;
import org.junit.jupiter.api.BeforeEach;
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
import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@Import(TestFixtures.class)
class AdminFlowTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private TestFixtures fixtures;
    @Autowired private UserRepository userRepository;
    @Autowired private PasswordEncoder passwordEncoder;

    private String adminToken;

    @BeforeEach
    void createAdmin() throws Exception {
        String email = "admin-" + UUID.randomUUID() + "@example.com";
        userRepository.save(new User(email, passwordEncoder.encode("admin-password"), "관리자", "010-0000-0000", Role.ADMIN));
        adminToken = TestAuth.login(mockMvc, email, "admin-password");
    }

    @Test
    void 대시보드_회원목록_물류센터() throws Exception {
        mockMvc.perform(get("/api/admin/dashboard").header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.statusCounts.ORDERED").exists())
                .andExpect(jsonPath("$.statusCounts.RETURNED").exists())
                .andExpect(jsonPath("$.dailyOrders.length()").value(7))
                .andExpect(jsonPath("$.lowStockThreshold").value(10))
                .andExpect(jsonPath("$.lowStockItems").isArray());

        mockMvc.perform(get("/api/admin/users?page=0&size=5").header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.size").value(5))
                .andExpect(jsonPath("$.content[0].password").doesNotExist());

        mockMvc.perform(get("/api/admin/warehouses").header("Authorization", "Bearer " + adminToken))
                .andExpect(jsonPath("$.length()").value(3));

        // 잘못된 페이지 값 → 400
        mockMvc.perform(get("/api/admin/users?page=-1").header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("INVALID_INPUT"));
    }

    @Test
    void 상품_등록_수정_재고조정_삭제() throws Exception {
        String body = mockMvc.perform(post("/api/admin/products").header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(productJson("새 상품", 12000)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.totalStock").value(0))
                .andReturn().getResponse().getContentAsString();
        int productId = JsonPath.read(body, "$.id");

        mockMvc.perform(put("/api/admin/products/" + productId).header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(productJson("이름 바꾼 상품", 15000)))
                .andExpect(jsonPath("$.name").value("이름 바꾼 상품"))
                .andExpect(jsonPath("$.price").value(15000));

        // 경기 센터에 재고 30개 (행이 없으면 새로 만든다)
        long gyeonggiId = fixtures.warehouse(WarehouseRegion.GYEONGGI).getId();
        mockMvc.perform(put("/api/admin/inventories").header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"productId\":" + productId + ",\"warehouseId\":" + gyeonggiId + ",\"quantity\":30}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.quantity").value(30))
                .andExpect(jsonPath("$.warehouseName").value("경기 물류센터"));

        mockMvc.perform(get("/api/products/" + productId)).andExpect(jsonPath("$.totalStock").value(30));

        // 주문 이력이 없으므로 삭제 가능
        mockMvc.perform(delete("/api/admin/products/" + productId).header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isNoContent());
        mockMvc.perform(get("/api/products/" + productId)).andExpect(status().isNotFound());
    }

    @Test
    void 주문_상태변경과_목록_배송목록() throws Exception {
        String customer = signupAndLogin(mockMvc, "cust-" + UUID.randomUUID() + "@example.com", "password123");
        Product product = fixtures.productWithStock(10000, 3);
        mockMvc.perform(post("/api/cart/items").header("Authorization", "Bearer " + customer)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"productId\":" + product.getId() + ",\"quantity\":2}"));
        String body = mockMvc.perform(post("/api/orders").header("Authorization", "Bearer " + customer)
                        .contentType(MediaType.APPLICATION_JSON).content(TestFixtures.ORDER_BODY))
                .andReturn().getResponse().getContentAsString();
        int orderId = JsonPath.read(body, "$.id");

        // 예약된 2개보다 적게 재고를 줄이면 400
        mockMvc.perform(put("/api/admin/inventories").header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"productId\":" + product.getId() + ",\"warehouseId\":"
                                + fixtures.warehouse(WarehouseRegion.SEOUL).getId() + ",\"quantity\":1}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("INVALID_STOCK_QUANTITY"));

        // 주문 이력이 있는 상품은 삭제 불가
        mockMvc.perform(delete("/api/admin/products/" + product.getId()).header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("PRODUCT_IN_USE"));

        mockMvc.perform(get("/api/admin/orders?status=ORDERED&size=100").header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].status").value("ORDERED"))
                .andExpect(jsonPath("$.content[0].userName").exists());

        // 주문완료 → 출고 (포장 건너뛰기) 불가
        changeStatus(orderId, "SHIPPED").andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("INVALID_STATUS_CHANGE"));
        // 관리자는 취소로 바꿀 수 없다 (고객 요청으로만)
        changeStatus(orderId, "CANCELED").andExpect(status().isConflict());

        changeStatus(orderId, "PACKING").andExpect(status().isOk()).andExpect(jsonPath("$.status").value("PACKING"));
        changeStatus(orderId, "SHIPPED").andExpect(status().isOk())
                .andExpect(jsonPath("$.shipment.status").value("SHIPPED"))
                .andExpect(jsonPath("$.cancelInfo.type").value("RETURN"));
        assertThat(fixtures.inventory(product).getQuantity()).isEqualTo(1); // 3 - 2

        mockMvc.perform(get("/api/admin/orders/" + orderId + "/history").header("Authorization", "Bearer " + adminToken))
                .andExpect(jsonPath("$.length()").value(3))
                .andExpect(jsonPath("$[2].toStatus").value("SHIPPED"));

        mockMvc.perform(get("/api/admin/shipments?status=SHIPPED&size=100").header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].shipment.status").value("SHIPPED"))
                .andExpect(jsonPath("$.content[0].lastEvent.status").value("SHIPPED"))
                .andExpect(jsonPath("$.content[0].estimatedArrivalAt").exists());
    }

    private org.springframework.test.web.servlet.ResultActions changeStatus(int orderId, String status) throws Exception {
        return mockMvc.perform(patch("/api/admin/orders/" + orderId + "/status").header("Authorization", "Bearer " + adminToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"status\":\"" + status + "\"}"));
    }

    private String productJson(String name, int price) {
        return "{\"categoryId\":" + fixtures.anyCategoryId() + ",\"name\":\"" + name + "\",\"description\":\"설명\","
                + "\"price\":" + price + ",\"optionName\":null,\"imageUrl\":\"\"}";
    }
}
