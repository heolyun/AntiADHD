package com.antiadhd.auth;

import com.antiadhd.auth.dto.AuthResponse;
import com.antiadhd.auth.dto.LoginRequest;
import com.antiadhd.auth.dto.SignupRequest;
import com.antiadhd.common.exception.ConflictException;
import com.antiadhd.common.exception.UnauthorizedException;
import com.antiadhd.user.AppUser;
import com.antiadhd.user.UserRepository;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;
    private final PasswordEncoder passwordEncoder;
    private final UserRepository userRepository;

    public AuthService(
            AuthenticationManager authenticationManager,
            JwtService jwtService,
            PasswordEncoder passwordEncoder,
            UserRepository userRepository
    ) {
        this.authenticationManager = authenticationManager;
        this.jwtService = jwtService;
        this.passwordEncoder = passwordEncoder;
        this.userRepository = userRepository;
    }

    @Transactional
    public AuthResponse signup(SignupRequest request) {
        String email = normalizeEmail(request.email());
        if (userRepository.existsByEmail(email)) {
            throw new ConflictException("Email is already registered.");
        }

        AppUser user = new AppUser();
        user.setEmail(email);
        user.setName(request.name().trim());
        user.setPassword(passwordEncoder.encode(request.password()));

        AppUser saved = userRepository.save(user);
        return AuthResponse.from(jwtService.generateToken(saved), saved);
    }

    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest request) {
        String email = normalizeEmail(request.email());
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(email, request.password())
        );

        AppUser user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UnauthorizedException("Authentication is required."));
        return AuthResponse.from(jwtService.generateToken(user), user);
    }

    private String normalizeEmail(String email) {
        return email.trim().toLowerCase();
    }
}
