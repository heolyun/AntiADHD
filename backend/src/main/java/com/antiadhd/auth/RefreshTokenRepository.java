package com.antiadhd.auth;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

interface RefreshTokenRepository extends JpaRepository<RefreshToken, UUID> {
    Optional<RefreshToken> findByTokenHashAndExpiresAtAfter(String tokenHash, Instant now);
    void deleteByTokenHash(String tokenHash);
    long deleteByExpiresAtBefore(Instant now);
}
