package com.antiadhd.user;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.antiadhd.auth.JwtService;
import com.antiadhd.auth.RefreshTokenService;
import com.antiadhd.auth.dto.AuthResponse;
import com.antiadhd.common.exception.UnauthorizedException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {
    @Mock UserRepository userRepository;
    @Mock PasswordEncoder passwordEncoder;
    @Mock RefreshTokenService refreshTokenService;
    @Mock JwtService jwtService;

    private UserService service;
    private AppUser user;

    @BeforeEach
    void setUp() {
        service = new UserService(userRepository, passwordEncoder, refreshTokenService, jwtService);
        user = new AppUser();
        user.setEmail("user@example.com");
        user.setName("User");
        user.setPassword("old-hash");
    }

    @Test
    void changePasswordRevokesSessionsAndReturnsFreshCredentials() {
        when(passwordEncoder.matches("old-password", "old-hash")).thenReturn(true);
        when(passwordEncoder.encode("new-password")).thenReturn("new-hash");
        when(userRepository.save(user)).thenReturn(user);
        when(jwtService.generateToken(user)).thenReturn("new-access");
        when(refreshTokenService.issue(user)).thenReturn("new-refresh");

        AuthResponse response = service.changePassword(user, "old-password", "new-password");

        assertThat(user.getPassword()).isEqualTo("new-hash");
        assertThat(user.getTokenVersion()).isEqualTo(1);
        assertThat(response.token()).isEqualTo("new-access");
        verify(refreshTokenService).revokeAll(user);
    }

    @Test
    void deleteAccountRequiresTheCurrentPassword() {
        when(passwordEncoder.matches("wrong", "old-hash")).thenReturn(false);

        assertThatThrownBy(() -> service.deleteAccount(user, "wrong"))
                .isInstanceOf(UnauthorizedException.class);
        verify(userRepository, never()).delete(user);
    }

    @Test
    void deleteAccountRevokesSessionsBeforeDeletingUser() {
        when(passwordEncoder.matches("correct", "old-hash")).thenReturn(true);

        service.deleteAccount(user, "correct");

        verify(refreshTokenService).revokeAll(user);
        verify(userRepository).delete(user);
    }
}
