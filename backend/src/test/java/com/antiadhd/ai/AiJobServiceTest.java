package com.antiadhd.ai;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

import com.antiadhd.ai.dto.AiJobAcceptedResponse;
import com.antiadhd.ai.dto.AiJobResponse;
import com.antiadhd.ai.dto.CreateTaskBreakdownRequest;
import com.antiadhd.common.exception.ResourceNotFoundException;
import com.antiadhd.user.AppUser;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.micrometer.core.instrument.simple.SimpleMeterRegistry;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class AiJobServiceTest {
    @Mock
    AiJobRepository aiJobRepository;

    AiJobService aiJobService;

    @BeforeEach
    void setUp() {
        Clock clock = Clock.fixed(Instant.parse("2026-07-21T00:00:00Z"), ZoneOffset.UTC);
        aiJobService = new AiJobService(
                aiJobRepository,
                new ObjectMapper().findAndRegisterModules(),
                clock,
                new SimpleMeterRegistry()
        );
    }

    @Test
    void createTaskBreakdown_storesPendingOwnedJob() {
        AppUser user = user("owner@example.com");
        CreateTaskBreakdownRequest request = new CreateTaskBreakdownRequest(
                "  AntiADHD 포트폴리오 완성하기  ",
                LocalDate.of(2026, 8, 1),
                120
        );
        when(aiJobRepository.save(org.mockito.ArgumentMatchers.any(AiJob.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        AiJobAcceptedResponse response = aiJobService.createTaskBreakdown(user, request);

        assertThat(response.jobId()).isNotNull();
        assertThat(response.status()).isEqualTo(AiJobStatus.PENDING);
    }

    @Test
    void get_returnsStructuredCompletedResult() {
        AppUser user = user("owner@example.com");
        AiJob job = new AiJob();
        job.setUser(user);
        job.setJobType(AiJobType.TASK_BREAKDOWN);
        job.setStatus(AiJobStatus.COMPLETED);
        job.setGoal("포트폴리오 완성");
        job.setNextAttemptAt(Instant.parse("2026-07-21T00:00:00Z"));
        job.setResultJson("""
                {"summary":"작게 나눠 진행합니다.","totalEstimatedMinutes":30,"steps":[
                  {"order":1,"title":"목록 작성","description":"할 일을 적습니다.","estimatedMinutes":30,"energyLevel":"LOW"}
                ]}
                """);
        when(aiJobRepository.findByIdAndUser(job.getId(), user)).thenReturn(Optional.of(job));

        AiJobResponse response = aiJobService.get(user, job.getId());

        assertThat(response.result()).isNotNull();
        assertThat(response.result().steps()).hasSize(1);
        assertThat(response.result().totalEstimatedMinutes()).isEqualTo(30);
    }

    @Test
    void get_hidesJobsOwnedByAnotherUser() {
        AppUser user = user("owner@example.com");
        UUID id = UUID.randomUUID();
        when(aiJobRepository.findByIdAndUser(id, user)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> aiJobService.get(user, id))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessage("AI job not found.");
    }

    private AppUser user(String email) {
        AppUser user = new AppUser();
        user.setEmail(email);
        user.setName("Test User");
        user.setPassword("encoded-password");
        return user;
    }
}
