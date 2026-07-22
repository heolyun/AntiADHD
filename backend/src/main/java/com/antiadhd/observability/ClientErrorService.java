package com.antiadhd.observability;

import com.antiadhd.observability.dto.ClientErrorRequest;
import com.antiadhd.user.AppUser;
import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.MeterRegistry;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

@Service
public class ClientErrorService {
    private static final Logger log = LoggerFactory.getLogger(ClientErrorService.class);
    private final MeterRegistry meterRegistry;

    public ClientErrorService(MeterRegistry meterRegistry) {
        this.meterRegistry = meterRegistry;
    }

    public void record(AppUser user, ClientErrorRequest request) {
        String context = "render_boundary".equals(request.context()) ? "render_boundary" : "unknown";
        String platform = switch (request.platform()) {
            case "android", "ios", "web" -> request.platform();
            default -> "unknown";
        };
        String version = sanitize(request.appVersion(), 30);
        String message = sanitize(request.message(), 500);

        Counter.builder("antiadhd.mobile.errors")
                .description("Unexpected errors reported by the mobile application")
                .tag("context", context)
                .tag("platform", platform)
                .register(meterRegistry)
                .increment();
        log.warn("Mobile error: userId={}, context={}, platform={}, version={}, message={}",
                user.getId(), context, platform, version, message);
    }

    private String sanitize(String value, int maxLength) {
        if (value == null || value.isBlank()) return "unknown";
        String sanitized = value
                .replaceAll("(?i)bearer\\s+[a-z0-9._-]+", "Bearer [redacted]")
                .replaceAll("(?i)sk-[a-z0-9_-]+", "sk-[redacted]")
                .replaceAll("[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}", "[redacted-email]")
                .replaceAll("[\\r\\n\\t]+", " ")
                .trim();
        return sanitized.substring(0, Math.min(sanitized.length(), maxLength));
    }
}
