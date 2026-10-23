package com.logistics.backend.user.service;

import com.logistics.backend.global.exception.BusinessException;
import com.logistics.backend.global.exception.ErrorCode;
import com.logistics.backend.global.security.JwtTokenProvider;
import com.logistics.backend.user.dto.LoginRequest;
import com.logistics.backend.user.dto.LoginResponse;
import com.logistics.backend.user.dto.SignupRequest;
import com.logistics.backend.user.dto.UserResponse;
import com.logistics.backend.user.entity.Role;
import com.logistics.backend.user.entity.User;
import com.logistics.backend.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;

    // 회원가입: 일반 회원(USER)으로만 가입된다. 관리자는 서버 시작 시 환경변수로 만든다
    @Transactional
    public UserResponse signup(SignupRequest request) {
        String email = request.email().trim().toLowerCase();
        if (userRepository.existsByEmail(email)) {
            throw new BusinessException(ErrorCode.DUPLICATE_EMAIL);
        }

        User user = new User(
                email,
                passwordEncoder.encode(request.password()), // 비밀번호는 암호화해서 저장
                request.name().trim(),
                request.phone(),
                Role.USER
        );
        try {
            // saveAndFlush: INSERT 를 바로 실행해서, unique 제약 위반을 이 자리에서 잡는다
            return UserResponse.from(userRepository.saveAndFlush(user));
        } catch (DataIntegrityViolationException e) {
            // 같은 이메일로 동시에 가입하면 두 요청 모두 위의 existsByEmail 검사를 통과할 수 있다.
            // 그러면 DB 의 unique 제약(users.email)이 두 번째 INSERT 를 막는데, 그 에러를 500 대신 409 로 바꾼다
            throw new BusinessException(ErrorCode.DUPLICATE_EMAIL);
        }
    }

    // 로그인: 이메일·비밀번호가 맞으면 JWT 토큰을 발급한다
    public LoginResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.email().trim().toLowerCase())
                .orElseThrow(() -> new BusinessException(ErrorCode.LOGIN_FAILED));

        // 이메일이 없을 때와 비밀번호가 틀릴 때 같은 메시지를 준다 (가입된 이메일인지 알려주지 않기 위해)
        if (!passwordEncoder.matches(request.password(), user.getPassword())) {
            throw new BusinessException(ErrorCode.LOGIN_FAILED);
        }

        String token = jwtTokenProvider.createToken(user.getId(), user.getEmail(), user.getRole());
        return new LoginResponse(token, "Bearer", jwtTokenProvider.getExpirationSeconds(), UserResponse.from(user));
    }
}
