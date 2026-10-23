package com.logistics.backend.user;

import com.logistics.backend.user.entity.Role;
import com.logistics.backend.user.entity.User;
import com.logistics.backend.user.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

// 회원가입: DB 저장 확인 + 같은 이메일 중복·동시 가입
@SpringBootTest
@AutoConfigureMockMvc
class SignupTest {

    private static final int THREADS = 10;

    @Autowired private MockMvc mockMvc;
    @Autowired private UserRepository userRepository;
    @Autowired private PasswordEncoder passwordEncoder;

    @Test
    void 새로_가입한_회원은_users_테이블에_저장된다() throws Exception {
        String email = "new-" + UUID.randomUUID() + "@example.com";

        mockMvc.perform(post("/api/auth/signup").contentType(MediaType.APPLICATION_JSON)
                        .content(signupJson(email.toUpperCase())))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.email").value(email)) // 소문자로 바꿔서 저장
                .andExpect(jsonPath("$.role").value("USER"))
                .andExpect(jsonPath("$.password").doesNotExist());

        // DB 에서 직접 꺼내 확인
        User saved = userRepository.findByEmail(email).orElseThrow();
        assertThat(saved.getId()).isNotNull();
        assertThat(saved.getName()).isEqualTo("새회원");
        assertThat(saved.getPhone()).isEqualTo("010-2222-3333");
        assertThat(saved.getRole()).isEqualTo(Role.USER);
        assertThat(saved.getCreatedAt()).isNotNull();
        // 비밀번호는 원래 값 그대로가 아니라 BCrypt 로 암호화되어 저장된다
        assertThat(saved.getPassword()).isNotEqualTo("password123");
        assertThat(passwordEncoder.matches("password123", saved.getPassword())).isTrue();
    }

    @Test
    void 이미_가입된_이메일이면_409() throws Exception {
        String email = "dup-" + UUID.randomUUID() + "@example.com";
        mockMvc.perform(post("/api/auth/signup").contentType(MediaType.APPLICATION_JSON).content(signupJson(email)))
                .andExpect(status().isCreated());

        mockMvc.perform(post("/api/auth/signup").contentType(MediaType.APPLICATION_JSON).content(signupJson(email)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("DUPLICATE_EMAIL"))
                .andExpect(jsonPath("$.message").value("이미 가입된 이메일입니다."));
    }

    // 중복 검사(existsByEmail)와 저장(INSERT) 사이에 다른 요청이 끼어들면 둘 다 검사를 통과한다.
    // 이때 DB 의 unique 제약이 두 번째 INSERT 를 막는데, 그 에러가 500 이 아니라 409 로 나가야 한다
    @Test
    void 같은_이메일로_동시에_가입하면_한_명만_성공하고_나머지는_409() throws Exception {
        String email = "race-" + UUID.randomUUID() + "@example.com";

        ExecutorService pool = Executors.newFixedThreadPool(THREADS);
        CountDownLatch ready = new CountDownLatch(THREADS);
        CountDownLatch start = new CountDownLatch(1);
        CountDownLatch done = new CountDownLatch(THREADS);
        List<Integer> statuses = Collections.synchronizedList(new ArrayList<>());
        List<Throwable> unexpected = Collections.synchronizedList(new ArrayList<>());

        for (int i = 0; i < THREADS; i++) {
            pool.submit(() -> {
                ready.countDown();
                try {
                    start.await(); // 모든 스레드가 준비된 뒤 한꺼번에 출발
                    int status = mockMvc.perform(post("/api/auth/signup").contentType(MediaType.APPLICATION_JSON)
                                    .content(signupJson(email)))
                            .andReturn().getResponse().getStatus();
                    statuses.add(status);
                } catch (Throwable e) {
                    unexpected.add(e);
                } finally {
                    done.countDown();
                }
            });
        }
        ready.await();
        start.countDown();
        assertThat(done.await(60, TimeUnit.SECONDS)).isTrue();
        pool.shutdown();

        assertThat(unexpected).isEmpty();
        assertThat(statuses).hasSize(THREADS);
        assertThat(statuses).doesNotContain(500);
        assertThat(statuses.stream().filter(s -> s == 201).count()).isEqualTo(1);
        assertThat(statuses.stream().filter(s -> s == 409).count()).isEqualTo(THREADS - 1);

        // DB 에는 한 명만 저장되어 있다
        assertThat(userRepository.findAll().stream().filter(u -> u.getEmail().equals(email)).count()).isEqualTo(1);
    }

    private static String signupJson(String email) {
        return "{\"email\":\"" + email + "\",\"password\":\"password123\",\"name\":\"새회원\",\"phone\":\"010-2222-3333\"}";
    }
}
