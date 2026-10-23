package com.logistics.backend.product;

import com.jayway.jsonpath.JsonPath;
import com.logistics.backend.TestAuth;
import com.logistics.backend.TestFixtures;
import com.logistics.backend.product.entity.Product;
import com.logistics.backend.product.repository.ProductRepository;
import com.logistics.backend.user.entity.Role;
import com.logistics.backend.user.entity.User;
import com.logistics.backend.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.UUID;

import static com.logistics.backend.TestAuth.signupAndLogin;
import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

// 관리자 상품 이미지 업로드: 형식·크기 검사, 저장, /uploads/** 로 제공, 예전 파일 삭제, 권한
@SpringBootTest
@AutoConfigureMockMvc
@Import(TestFixtures.class)
class ProductImageTest {

    // 진짜 PNG 파일의 앞부분 (매직 넘버) + 아무 데이터
    private static final byte[] PNG = {(byte) 0x89, 'P', 'N', 'G', 0x0D, 0x0A, 0x1A, 0x0A, 0, 0, 0, 13, 'I', 'H', 'D', 'R'};
    private static final byte[] JPG = {(byte) 0xFF, (byte) 0xD8, (byte) 0xFF, (byte) 0xE0, 0, 16, 'J', 'F', 'I', 'F'};
    private static final byte[] WEBP = {'R', 'I', 'F', 'F', 36, 0, 0, 0, 'W', 'E', 'B', 'P', 'V', 'P', '8', ' '};
    private static final byte[] GIF = {'G', 'I', 'F', '8', '9', 'a', 1, 0, 1, 0};

    @Autowired private MockMvc mockMvc;
    @Autowired private TestFixtures fixtures;
    @Autowired private UserRepository userRepository;
    @Autowired private ProductRepository productRepository;
    @Autowired private PasswordEncoder passwordEncoder;

    private String adminToken;

    @BeforeEach
    void createAdmin() throws Exception {
        String email = "admin-" + UUID.randomUUID() + "@example.com";
        userRepository.save(new User(email, passwordEncoder.encode("admin-password"), "관리자", "010-0000-0000", Role.ADMIN));
        adminToken = TestAuth.login(mockMvc, email, "admin-password");
    }

    @Test
    void 이미지를_올리면_저장되고_주소로_볼_수_있다() throws Exception {
        Product product = fixtures.productWithStock(10000, 5);

        String body = mockMvc.perform(multipart("/api/admin/products/" + product.getId() + "/image")
                        .file(new MockMultipartFile("file", "photo.png", "image/png", PNG))
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(product.getId()))
                .andReturn().getResponse().getContentAsString();
        String imageUrl = JsonPath.read(body, "$.imageUrl");
        assertThat(imageUrl).startsWith("/uploads/products/" + product.getId() + "-").endsWith(".png");

        // DB 의 products.image_url 이 바뀌었다
        assertThat(productRepository.findById(product.getId()).orElseThrow().getImageUrl()).isEqualTo(imageUrl);

        // 로그인 없이 /uploads/** 로 파일을 받을 수 있다
        byte[] served = mockMvc.perform(get(imageUrl))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsByteArray();
        assertThat(served).isEqualTo(PNG);

        // 상품 조회 응답에도 새 주소가 들어 있다
        mockMvc.perform(get("/api/products/" + product.getId()))
                .andExpect(jsonPath("$.imageUrl").value(imageUrl));

        // 다시 올리면(jpg) 새 파일로 바뀌고 예전 파일은 지워진다
        String body2 = mockMvc.perform(multipart("/api/admin/products/" + product.getId() + "/image")
                        .file(new MockMultipartFile("file", "photo.JPEG", "image/jpeg", JPG))
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        String newImageUrl = JsonPath.read(body2, "$.imageUrl");
        assertThat(newImageUrl).endsWith(".jpg");
        assertThat(Files.exists(uploadedFile(imageUrl))).isFalse();
        assertThat(Files.exists(uploadedFile(newImageUrl))).isTrue();

        // webp 도 된다
        mockMvc.perform(multipart("/api/admin/products/" + product.getId() + "/image")
                        .file(new MockMultipartFile("file", "photo.webp", "image/webp", WEBP))
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.imageUrl").value(org.hamcrest.Matchers.endsWith(".webp")));
    }

    @Test
    void 형식과_크기를_검사한다() throws Exception {
        Product product = fixtures.productWithStock(10000, 5);
        String url = "/api/admin/products/" + product.getId() + "/image";

        // gif 는 안 된다
        mockMvc.perform(multipart(url).file(new MockMultipartFile("file", "anim.gif", "image/gif", GIF))
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("INVALID_IMAGE"));

        // 확장자만 .png 로 바꾼 텍스트 파일 → 내용(매직 넘버)이 달라서 거절
        mockMvc.perform(multipart(url).file(new MockMultipartFile("file", "fake.png", "image/png", "hello".getBytes()))
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("INVALID_IMAGE"));

        // 빈 파일
        mockMvc.perform(multipart(url).file(new MockMultipartFile("file", "empty.png", "image/png", new byte[0]))
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("INVALID_IMAGE"));

        // 파일을 안 보냄
        mockMvc.perform(multipart(url).header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("INVALID_INPUT"));

        // 5MB 초과 → 413
        byte[] big = new byte[5 * 1024 * 1024 + 1];
        System.arraycopy(PNG, 0, big, 0, PNG.length);
        mockMvc.perform(multipart(url).file(new MockMultipartFile("file", "big.png", "image/png", big))
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isPayloadTooLarge())
                .andExpect(jsonPath("$.code").value("IMAGE_TOO_LARGE"));

        // 거절된 업로드는 상품 이미지를 바꾸지 않는다
        assertThat(productRepository.findById(product.getId()).orElseThrow().getImageUrl()).isNull();

        // 없는 상품 → 404
        mockMvc.perform(multipart("/api/admin/products/999999/image")
                        .file(new MockMultipartFile("file", "photo.png", "image/png", PNG))
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isNotFound());
    }

    @Test
    void 관리자만_올릴_수_있다() throws Exception {
        Product product = fixtures.productWithStock(10000, 5);
        String url = "/api/admin/products/" + product.getId() + "/image";
        MockMultipartFile file = new MockMultipartFile("file", "photo.png", "image/png", PNG);

        mockMvc.perform(multipart(url).file(file))
                .andExpect(status().isUnauthorized());

        String userToken = signupAndLogin(mockMvc, "user-" + UUID.randomUUID() + "@example.com", "password123");
        mockMvc.perform(multipart(url).file(file).header("Authorization", "Bearer " + userToken))
                .andExpect(status().isForbidden());
    }

    // "/uploads/products/x.png" → 테스트 업로드 폴더(build/test-uploads)의 실제 파일 경로
    private static Path uploadedFile(String imageUrl) {
        return Path.of("build/test-uploads", imageUrl.substring("/uploads/".length()));
    }
}
