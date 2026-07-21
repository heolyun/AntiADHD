package com.antiadhd.auth;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.antiadhd.user.AppUser;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class RefreshTokenServiceTest {
    @Mock
    RefreshTokenRepository repository;

    @Test
    void rotateConsumesOldTokenAndReturnsANewOpaqueToken() {
        Instant now = Instant.parse("2026-07-21T12:00:00Z");
        Clock clock = Clock.fixed(now, ZoneOffset.UTC);
        RefreshTokenService service = new RefreshTokenService(repository, Duration.ofDays(30), clock);
        AppUser user = new AppUser();
        user.setEmail("test@example.com");
        RefreshToken current = new RefreshToken(user, "stored-hash", now.plus(Duration.ofDays(1)), now);
        when(repository.findByTokenHashAndExpiresAtAfter(any(), any())).thenReturn(Optional.of(current));

        RefreshTokenService.RotatedRefreshToken rotated = service.rotate("old-secret");

        assertThat(rotated.user()).isSameAs(user);
        assertThat(rotated.token()).isNotBlank().doesNotContain("old-secret");
        verify(repository).delete(current);
        verify(repository).save(any(RefreshToken.class));
    }
}
