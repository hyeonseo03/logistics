package com.logistics.backend.global.init;

import com.logistics.backend.user.entity.Role;
import com.logistics.backend.user.entity.User;
import com.logistics.backend.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

// 서버가 시작될 때 관리자 계정이 없으면 만든다.
// 관리자 이메일·비밀번호는 코드에 쓰지 않고 환경변수 ADMIN_EMAIL, ADMIN_PASSWORD 로 받는다
@Slf4j
@Component
@Order(1) // 샘플 데이터(DataInitializer)보다 먼저 실행
@RequiredArgsConstructor
public class AdminInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.admin.email:}")
    private String adminEmail;

    @Value("${app.admin.password:}")
    private String adminPassword;

    @Override
    @Transactional
    public void run(String... args) {
        if (adminEmail.isBlank() || adminPassword.isBlank()) {
            log.warn("ADMIN_EMAIL / ADMIN_PASSWORD 환경변수가 없어 관리자 계정을 만들지 않았습니다.");
            return;
        }

        String email = adminEmail.trim().toLowerCase();
        if (userRepository.existsByEmail(email)) {
            return; // 이미 있으면 그대로 둔다 (비밀번호도 바꾸지 않는다)
        }

        userRepository.save(new User(email, passwordEncoder.encode(adminPassword), "관리자", "010-0000-0000", Role.ADMIN));
        log.info("관리자 계정을 만들었습니다: {}", email);
    }
}
