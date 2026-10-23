package com.logistics.backend.user.service;

import com.logistics.backend.global.exception.BusinessException;
import com.logistics.backend.global.exception.ErrorCode;
import com.logistics.backend.user.dto.ChangePasswordRequest;
import com.logistics.backend.user.dto.UpdateProfileRequest;
import com.logistics.backend.user.dto.UserResponse;
import com.logistics.backend.user.entity.User;
import com.logistics.backend.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public UserResponse getMe(Long userId) {
        return UserResponse.from(findUser(userId));
    }

    // 이름·전화번호 수정. @Transactional 안에서 엔티티 값을 바꾸면 끝날 때 자동으로 UPDATE 된다 (변경 감지)
    @Transactional
    public UserResponse updateProfile(Long userId, UpdateProfileRequest request) {
        User user = findUser(userId);
        user.updateProfile(request.name().trim(), request.phone());
        return UserResponse.from(user);
    }

    @Transactional
    public void changePassword(Long userId, ChangePasswordRequest request) {
        User user = findUser(userId);
        checkPassword(user, request.currentPassword());
        user.changePassword(passwordEncoder.encode(request.newPassword()));
    }

    // 마이페이지에서 내 정보를 보기 전에 비밀번호를 한 번 더 확인한다. 틀리면 401
    public void verifyPassword(Long userId, String password) {
        checkPassword(findUser(userId), password);
    }

    private void checkPassword(User user, String rawPassword) {
        if (!passwordEncoder.matches(rawPassword, user.getPassword())) {
            throw new BusinessException(ErrorCode.WRONG_PASSWORD);
        }
    }

    private User findUser(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));
    }
}
