package com.logistics.backend.global.security;

import com.logistics.backend.user.entity.Role;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.Optional;

// JWT(로그인 토큰)를 만들고 검증한다.
// 비밀키는 코드에 쓰지 않고 환경변수 JWT_SECRET 으로 받는다 (application.yml 의 jwt.secret)
@Component
public class JwtTokenProvider {

    private final SecretKey key;
    private final long expirationSeconds;

    public JwtTokenProvider(@Value("${jwt.secret}") String secret,
                            @Value("${jwt.expiration-seconds}") long expirationSeconds) {
        byte[] keyBytes = secret.getBytes(StandardCharsets.UTF_8);
        if (keyBytes.length < 32) {
            // HS256 은 256비트(32바이트) 이상의 키가 필요하다
            throw new IllegalStateException("환경변수 JWT_SECRET 은 32자 이상이어야 합니다.");
        }
        this.key = Keys.hmacShaKeyFor(keyBytes);
        this.expirationSeconds = expirationSeconds;
    }

    public String createToken(Long userId, String email, Role role) {
        Date now = new Date();
        Date expiresAt = new Date(now.getTime() + expirationSeconds * 1000);

        return Jwts.builder()
                .subject(String.valueOf(userId)) // 토큰 주인 = 회원 id
                .claim("email", email)
                .claim("role", role.name())
                .issuedAt(now)
                .expiration(expiresAt)
                .signWith(key) // 서버만 아는 키로 서명 → 누가 내용을 바꾸면 검증에 실패한다
                .compact();
    }

    // 토큰이 올바르면 LoginUser, 서명이 틀렸거나 만료되었으면 빈 값
    public Optional<LoginUser> parse(String token) {
        try {
            Claims claims = Jwts.parser()
                    .verifyWith(key)
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();

            return Optional.of(new LoginUser(
                    Long.valueOf(claims.getSubject()),
                    claims.get("email", String.class),
                    Role.valueOf(claims.get("role", String.class))
            ));
        } catch (JwtException | IllegalArgumentException e) {
            return Optional.empty();
        }
    }

    public long getExpirationSeconds() {
        return expirationSeconds;
    }
}
