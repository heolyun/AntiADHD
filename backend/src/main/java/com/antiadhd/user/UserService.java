package com.antiadhd.user;

import com.antiadhd.auth.JwtService;
import com.antiadhd.auth.RefreshTokenService;
import com.antiadhd.auth.dto.AuthResponse;
import com.antiadhd.common.exception.UnauthorizedException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UserService {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final RefreshTokenService refreshTokenService;
    private final JwtService jwtService;

    public UserService(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            RefreshTokenService refreshTokenService,
            JwtService jwtService
    ) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.refreshTokenService = refreshTokenService;
        this.jwtService = jwtService;
    }

    @Transactional
    public AuthResponse changePassword(AppUser user, String currentPassword, String newPassword) {
        verifyPassword(user, currentPassword);
        user.setPassword(passwordEncoder.encode(newPassword));
        user.incrementTokenVersion();
        refreshTokenService.revokeAll(user);
        AppUser saved = userRepository.save(user);
        return AuthResponse.from(jwtService.generateToken(saved), refreshTokenService.issue(saved), saved);
    }

    @Transactional
    public void deleteAccount(AppUser user, String password) {
        verifyPassword(user, password);
        refreshTokenService.revokeAll(user);
        userRepository.delete(user);
    }

    private void verifyPassword(AppUser user, String password) {
        if (!passwordEncoder.matches(password, user.getPassword())) {
            throw new UnauthorizedException("Current password is incorrect.");
        }
    }
}
