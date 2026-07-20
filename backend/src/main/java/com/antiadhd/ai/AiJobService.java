package com.antiadhd.ai;

import com.antiadhd.ai.dto.AiJobAcceptedResponse;
import com.antiadhd.ai.dto.AiJobResponse;
import com.antiadhd.ai.dto.CreateTaskBreakdownRequest;
import com.antiadhd.ai.dto.TaskBreakdownResult;
import com.antiadhd.common.exception.ResourceNotFoundException;
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
    private final Counter createdCounter;

    public AiJobService(
            AiJobRepository aiJobRepository,
            ObjectMapper objectMapper,
            Clock clock,
            MeterRegistry meterRegistry
    ) {
        this.aiJobRepository = aiJobRepository;
        this.objectMapper = objectMapper;
        this.clock = clock;
        this.createdCounter = Counter.builder("antiadhd.ai.jobs.created")
                .tag("type", "task_breakdown")
                .register(meterRegistry);
    }

    @Transactional
    public AiJobAcceptedResponse createTaskBreakdown(AppUser user, CreateTaskBreakdownRequest request) {
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
