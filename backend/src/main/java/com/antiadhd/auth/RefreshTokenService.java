package com.antiadhd.auth;

import com.antiadhd.common.exception.UnauthorizedException;
import com.antiadhd.user.AppUser;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.Base64;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class RefreshTokenService {
    private static final SecureRandom RANDOM = new SecureRandom();
    private final RefreshTokenRepository repository;
    private final Duration lifetime;
    private final Clock clock;

    @Autowired
    public RefreshTokenService(
            RefreshTokenRepository repository,
            @Value("${app.jwt.refresh-expiration-ms:2592000000}") long expirationMs
    ) {
        this(repository, Duration.ofMillis(expirationMs), Clock.systemUTC());
    }

    RefreshTokenService(RefreshTokenRepository repository, Duration lifetime, Clock clock) {
        this.repository = repository;
        this.lifetime = lifetime;
        this.clock = clock;
    }

    @Transactional
    public String issue(AppUser user) {
        byte[] bytes = new byte[48];
        RANDOM.nextBytes(bytes);
        String rawToken = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
        Instant now = clock.instant();
        repository.deleteByExpiresAtBefore(now);
        repository.save(new RefreshToken(user, hash(rawToken), now.plus(lifetime), now));
        return rawToken;
    }

    @Transactional
    public RotatedRefreshToken rotate(String rawToken) {
        RefreshToken current = repository.findByTokenHashAndExpiresAtAfter(hash(rawToken), clock.instant())
                .orElseThrow(() -> new UnauthorizedException("Refresh token is invalid or expired."));
        AppUser user = current.getUser();
        repository.delete(current);
        return new RotatedRefreshToken(user, issue(user));
    }

    @Transactional
    public void revoke(String rawToken) {
        repository.deleteByTokenHash(hash(rawToken));
    }

    @Transactional
    public void revokeAll(AppUser user) {
        repository.deleteByUserId(user.getId());
    }

    private String hash(String rawToken) {
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256")
                    .digest(rawToken.getBytes(StandardCharsets.UTF_8));
            return java.util.HexFormat.of().formatHex(digest);
        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException("SHA-256 is unavailable.", exception);
        }
    }

    public record RotatedRefreshToken(AppUser user, String token) {
    }
}
