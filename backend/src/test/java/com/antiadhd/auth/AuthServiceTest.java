package com.antiadhd.auth;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.antiadhd.auth.dto.AuthResponse;
import com.antiadhd.auth.dto.LoginRequest;
import com.antiadhd.auth.dto.SignupRequest;
import com.antiadhd.common.exception.ConflictException;
import com.antiadhd.user.AppUser;
import com.antiadhd.user.UserRepository;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.crypto.password.PasswordEncoder;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {
    @Mock
    AuthenticationManager authenticationManager;

    @Mock
    JwtService jwtService;

    @Mock
    PasswordEncoder passwordEncoder;

    @Mock
    UserRepository userRepository;

    @Mock
    RefreshTokenService refreshTokenService;

    @InjectMocks
    AuthService authService;

    @Test
    void signup_normalizesEmailAndEncodesPassword() {
        when(userRepository.existsByEmail("test@example.com")).thenReturn(false);
        when(passwordEncoder.encode("password123")).thenReturn("encoded-password");
        when(userRepository.save(any(AppUser.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(jwtService.generateToken(any(AppUser.class))).thenReturn("token");
        when(refreshTokenService.issue(any(AppUser.class))).thenReturn("refresh-token");

        AuthResponse response = authService.signup(new SignupRequest(" TEST@Example.COM ", " Test User ", "password123"));

        ArgumentCaptor<AppUser> userCaptor = ArgumentCaptor.forClass(AppUser.class);
        verify(userRepository).save(userCaptor.capture());
        AppUser saved = userCaptor.getValue();
        assertThat(saved.getEmail()).isEqualTo("test@example.com");
        assertThat(saved.getName()).isEqualTo("Test User");
        assertThat(saved.getPassword()).isEqualTo("encoded-password");
        assertThat(response.token()).isEqualTo("token");
        assertThat(response.refreshToken()).isEqualTo("refresh-token");
        assertThat(response.user().email()).isEqualTo("test@example.com");
    }

    @Test
    void signup_rejectsDuplicateEmail() {
        when(userRepository.existsByEmail("test@example.com")).thenReturn(true);

        assertThatThrownBy(() -> authService.signup(new SignupRequest("test@example.com", "Test User", "password123")))
                .isInstanceOf(ConflictException.class)
                .hasMessage("Email is already registered.");
    }

    @Test
    void login_authenticatesNormalizedEmail() {
        AppUser user = new AppUser();
        user.setEmail("test@example.com");
        user.setName("Test User");
        user.setPassword("encoded-password");
        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(user));
        when(jwtService.generateToken(user)).thenReturn("token");
        when(refreshTokenService.issue(user)).thenReturn("refresh-token");

        AuthResponse response = authService.login(new LoginRequest(" TEST@Example.COM ", "password123"));

        assertThat(response.token()).isEqualTo("token");
        assertThat(response.refreshToken()).isEqualTo("refresh-token");
        assertThat(response.user().email()).isEqualTo("test@example.com");
        verify(authenticationManager).authenticate(any());
    }
}
