package com.antiadhd.auth;

import com.antiadhd.user.AppUser;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;
import javax.crypto.SecretKey;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class JwtService {
    private final String secret;
    private final long expirationMs;

    public JwtService(
            @Value("${app.jwt.secret}") String secret,
            @Value("${app.jwt.expiration-ms}") long expirationMs
    ) {
        this.secret = secret;
        this.expirationMs = expirationMs;
    }

    public String generateToken(AppUser user) {
        Instant now = Instant.now();
        return Jwts.builder()
                .subject(user.getEmail())
                .claim("userId", user.getId())
                .claim("tokenVersion", user.getTokenVersion())
                .issuedAt(Date.from(now))
                .expiration(Date.from(now.plusMillis(expirationMs)))
                .signWith(signingKey())
                .compact();
    }

    public String extractSubject(String token) {
        try {
            return claims(token).getSubject();
        } catch (RuntimeException ex) {
            return null;
        }
    }

    public boolean isTokenValid(String token, AppUser user) {
        String subject = extractSubject(token);
        return subject != null
                && subject.equals(user.getEmail())
                && tokenVersion(token) == user.getTokenVersion()
                && !isExpired(token);
    }

    private boolean isExpired(String token) {
        try {
            return claims(token).getExpiration().before(new Date());
        } catch (RuntimeException ex) {
            return true;
        }
    }

    private int tokenVersion(String token) {
        try {
            Integer version = claims(token).get("tokenVersion", Integer.class);
            return version == null ? 0 : version;
        } catch (RuntimeException ex) {
            return -1;
        }
    }

    private Claims claims(String token) {
        return Jwts.parser()
                .verifyWith(signingKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    private SecretKey signingKey() {
        byte[] keyBytes;
        try {
            keyBytes = Decoders.BASE64.decode(secret);
        } catch (RuntimeException ex) {
            keyBytes = secret.getBytes(StandardCharsets.UTF_8);
        }
        return Keys.hmacShaKeyFor(keyBytes);
    }
}
