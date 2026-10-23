package com.logistics.backend.global.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;
import java.util.Optional;

// 요청마다 한 번 실행되어 "Authorization: Bearer {토큰}" 헤더를 확인한다.
// 토큰이 올바르면 "이 요청은 누구의 요청인지"를 SecurityContext 에 넣어 둔다.
// 토큰이 없거나 틀리면 아무것도 넣지 않는다 → 로그인이 필요한 API 라면 401 이 된다
// (@Component 로 등록하면 스프링 부트가 일반 서블릿 필터로도 한 번 더 등록하므로, SecurityConfig 에서 직접 만든다)
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    // 토큰이 있었지만 잘못된 경우를 표시해 두고, 401 응답 메시지를 고를 때 쓴다
    public static final String INVALID_TOKEN_ATTRIBUTE = "invalidToken";

    private static final String BEARER_PREFIX = "Bearer ";

    private final JwtTokenProvider jwtTokenProvider;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        String header = request.getHeader(HttpHeaders.AUTHORIZATION);

        if (header != null && header.startsWith(BEARER_PREFIX)) {
            String token = header.substring(BEARER_PREFIX.length());
            Optional<LoginUser> loginUser = jwtTokenProvider.parse(token);

            if (loginUser.isPresent()) {
                LoginUser user = loginUser.get();
                var authentication = new UsernamePasswordAuthenticationToken(
                        user, // 컨트롤러의 @AuthenticationPrincipal 로 받는 값
                        null,
                        List.of(new SimpleGrantedAuthority("ROLE_" + user.role().name()))
                );
                SecurityContextHolder.getContext().setAuthentication(authentication);
            } else {
                request.setAttribute(INVALID_TOKEN_ATTRIBUTE, true);
            }
        }

        filterChain.doFilter(request, response);
    }
}
