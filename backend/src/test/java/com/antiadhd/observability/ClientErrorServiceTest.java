package com.antiadhd.observability;

import static org.assertj.core.api.Assertions.assertThat;

import com.antiadhd.observability.dto.ClientErrorRequest;
import com.antiadhd.user.AppUser;
import io.micrometer.core.instrument.simple.SimpleMeterRegistry;
import org.junit.jupiter.api.Test;

class ClientErrorServiceTest {
    @Test
    void recordsACounterWithoutUsingTheMessageAsAMetricTag() {
        SimpleMeterRegistry registry = new SimpleMeterRegistry();
        ClientErrorService service = new ClientErrorService(registry);
        AppUser user = new AppUser();

        service.record(user, new ClientErrorRequest(
                "render_boundary",
                "Bearer secret-token\nfailed",
                "0.2.0",
                "android"
        ));

        assertThat(registry.get("antiadhd.mobile.errors")
                .tags("context", "render_boundary", "platform", "android")
                .counter().count()).isEqualTo(1);
    }
}
