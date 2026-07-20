package com.antiadhd.ai;

import com.antiadhd.ai.dto.AiJobAcceptedResponse;
import com.antiadhd.ai.dto.AiJobResponse;
import com.antiadhd.ai.dto.CreateTaskBreakdownRequest;
import com.antiadhd.ai.dto.TaskBreakdownResult;
import com.antiadhd.ai.config.AiUsageProperties;
import com.antiadhd.common.exception.ResourceNotFoundException;
import com.antiadhd.common.exception.TooManyRequestsException;
import com.antiadhd.user.AppUser;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.MeterRegistry;
import java.time.Clock;
import java.time.Instant;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AiJobService {
    private final AiJobRepository aiJobRepository;
    private final ObjectMapper objectMapper;
    private final Clock clock;
    private final AiUsageProperties usageProperties;
    private final Counter createdCounter;

    public AiJobService(
            AiJobRepository aiJobRepository,
            ObjectMapper objectMapper,
            Clock clock,
            AiUsageProperties usageProperties,
            MeterRegistry meterRegistry
    ) {
        this.aiJobRepository = aiJobRepository;
        this.objectMapper = objectMapper;
        this.clock = clock;
        this.usageProperties = usageProperties;
        this.createdCounter = Counter.builder("antiadhd.ai.jobs.created")
                .tag("type", "task_breakdown")
                .register(meterRegistry);
    }

    @Transactional
    public AiJobAcceptedResponse createTaskBreakdown(AppUser user, CreateTaskBreakdownRequest request) {
        enforceDailyLimit(user);
        AiJob job = new AiJob();
        job.setUser(user);
        job.setJobType(AiJobType.TASK_BREAKDOWN);
        job.setStatus(AiJobStatus.PENDING);
        job.setGoal(request.goal().trim());
        job.setDeadline(request.deadline());
        job.setAvailableMinutes(request.availableMinutes());
        job.setNextAttemptAt(Instant.now(clock));
        AiJob saved = aiJobRepository.save(job);
        createdCounter.increment();
        return AiJobAcceptedResponse.from(saved);
    }

    private void enforceDailyLimit(AppUser user) {
        Instant now = Instant.now(clock);
        Instant start = now.atZone(usageProperties.getResetZone())
                .toLocalDate()
                .atStartOfDay(usageProperties.getResetZone())
                .toInstant();
        Instant end = start.atZone(usageProperties.getResetZone())
                .plusDays(1)
                .toInstant();
        long used = aiJobRepository.countByUserAndCreatedAtGreaterThanEqualAndCreatedAtLessThan(
                user,
                start,
                end
        );
        if (used >= usageProperties.getDailyLimitPerUser()) {
            throw new TooManyRequestsException("Daily AI task breakdown limit reached.");
        }
    }

    @Transactional(readOnly = true)
    public AiJobResponse get(AppUser user, UUID id) {
        AiJob job = aiJobRepository.findByIdAndUser(id, user)
                .orElseThrow(() -> new ResourceNotFoundException("AI job not found."));
        return toResponse(job);
    }

    private AiJobResponse toResponse(AiJob job) {
        TaskBreakdownResult result = null;
        if (job.getResultJson() != null) {
            try {
                result = objectMapper.readValue(job.getResultJson(), TaskBreakdownResult.class);
            } catch (JsonProcessingException exception) {
                throw new IllegalStateException("Stored AI job result is invalid.", exception);
            }
        }
        return new AiJobResponse(
                job.getId(),
                job.getJobType(),
                job.getStatus(),
                job.getGoal(),
                job.getDeadline(),
                job.getAvailableMinutes(),
                result,
                job.getFailureCode(),
                job.getFailureMessage(),
                job.getAttemptCount(),
                job.getCreatedAt(),
                job.getCompletedAt()
        );
    }
}
