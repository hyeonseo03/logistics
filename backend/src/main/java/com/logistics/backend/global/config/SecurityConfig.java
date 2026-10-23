package com.logistics.backend.global.config;

import com.logistics.backend.global.security.JwtAuthenticationFilter;
import com.logistics.backend.global.security.JwtTokenProvider;
import com.logistics.backend.global.security.SecurityErrorHandler;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

// 로그인·권한 설정
// - 세션을 쓰지 않고, 요청마다 JWT 토큰으로 누구인지 확인한다
// - 어떤 주소를 누가 호출할 수 있는지 한 곳에서 정한다
@Configuration
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtTokenProvider jwtTokenProvider;
    private final SecurityErrorHandler securityErrorHandler;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .csrf(AbstractHttpConfigurer::disable)           // 쿠키 세션을 안 쓰므로 CSRF 보호가 필요 없다
                .httpBasic(AbstractHttpConfigurer::disable)
                .formLogin(AbstractHttpConfigurer::disable)
                .cors(Customizer.withDefaults())                 // 아래 corsConfigurationSource() 를 사용
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll() // CORS 사전 요청
                        // 누구나: 회원가입·로그인
                        .requestMatchers(HttpMethod.POST, "/api/auth/signup", "/api/auth/login").permitAll()
                        // 누구나: 상품·카테고리·물류센터·재고 조회 (프론트 상품 목록이 재고 목록으로 출고 센터를 계산한다)
                        .requestMatchers(HttpMethod.GET,
                                "/api/hello",
                                "/api/products", "/api/products/**",
                                "/api/categories", "/api/categories/**",
                                "/api/warehouses", "/api/warehouses/**",
                                "/api/inventories").permitAll()
                        // 누구나: AI 도우미 (로그인했으면 내 주문 정보까지 답한다)
                        .requestMatchers("/api/assistant/**").permitAll()
                        // 관리자만
                        .requestMatchers("/api/admin/**").hasRole("ADMIN")
                        // 그 밖의 모든 API (장바구니, 주문, 마이페이지 등)는 로그인 필요
                        .anyRequest().authenticated()
                )
                .exceptionHandling(exception -> exception
                        .authenticationEntryPoint(securityErrorHandler) // 401
                        .accessDeniedHandler(securityErrorHandler)      // 403
                )
                // 아이디/비밀번호 로그인 필터보다 먼저 JWT 필터를 실행한다
                .addFilterBefore(new JwtAuthenticationFilter(jwtTokenProvider), UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    // 프론트엔드(Next.js 개발 서버, localhost:3000)에서 /api/** 를 호출할 수 있게 허용한다
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOrigins(List.of("http://localhost:3000"));
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        config.setAllowCredentials(true);
        config.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/api/**", config);
        return source;
    }

    // 비밀번호를 BCrypt 로 암호화한다 (같은 비밀번호도 매번 다른 값이 되고, 원래 값으로 되돌릴 수 없다)
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
