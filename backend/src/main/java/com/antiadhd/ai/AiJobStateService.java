package com.antiadhd.ai;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AiJobStateService {
    private final AiJobRepository aiJobRepository;
    private final ObjectMapper objectMapper;
    private final Clock clock;

    public AiJobStateService(AiJobRepository aiJobRepository, ObjectMapper objectMapper, Clock clock) {
        this.aiJobRepository = aiJobRepository;
        this.objectMapper = objectMapper;
        this.clock = clock;
    }

    @Transactional
    public void complete(UUID jobId, OpenAiTaskBreakdownResult response) {
        AiJob job = aiJobRepository.findById(jobId)
                .orElseThrow(() -> new IllegalStateException("Claimed AI job no longer exists."));
        try {
            job.setResultJson(objectMapper.writeValueAsString(response.result()));
        } catch (JsonProcessingException exception) {
            throw new IllegalStateException("Unable to serialize the AI job result.", exception);
        }
        job.setProviderResponseId(response.providerResponseId());
        job.setModel(response.model());
        job.setStatus(AiJobStatus.COMPLETED);
        job.setCompletedAt(Instant.now(clock));
        job.setClaimedAt(null);
    }

    @Transactional
    public void completeVoiceCommand(UUID jobId, OpenAiVoiceCommandResult response) {
        AiJob job = aiJobRepository.findById(jobId)
                .orElseThrow(() -> new IllegalStateException("Claimed AI job no longer exists."));
        try {
            job.setResultJson(objectMapper.writeValueAsString(response.result()));
        } catch (JsonProcessingException exception) {
            throw new IllegalStateException("Unable to serialize the voice command result.", exception);
        }
        job.setProviderResponseId(response.providerResponseId());
        job.setModel(response.model());
        job.setStatus(AiJobStatus.COMPLETED);
        job.setCompletedAt(Instant.now(clock));
        job.setClaimedAt(null);
    }

    @Transactional
    public AiJobStatus failOrRetry(UUID jobId, OpenAiException failure, int maxAttempts) {
        AiJob job = aiJobRepository.findById(jobId)
                .orElseThrow(() -> new IllegalStateException("Claimed AI job no longer exists."));
        job.setFailureCode(failure.getCode());
        job.setFailureMessage(safeMessage(failure.getMessage()));
        job.setClaimedAt(null);

        if (failure.isRetryable() && job.getAttemptCount() < maxAttempts) {
            job.setStatus(AiJobStatus.PENDING);
            job.setNextAttemptAt(Instant.now(clock).plus(retryDelay(job.getAttemptCount())));
            return AiJobStatus.PENDING;
        }

        job.setStatus(AiJobStatus.FAILED);
        job.setCompletedAt(Instant.now(clock));
        return AiJobStatus.FAILED;
    }

    private Duration retryDelay(int attemptCount) {
        return switch (attemptCount) {
            case 1 -> Duration.ofSeconds(10);
            case 2 -> Duration.ofSeconds(30);
            default -> Duration.ofMinutes(1);
        };
    }

    private String safeMessage(String message) {
        if (message == null || message.isBlank()) {
            return "AI processing failed.";
        }
        return message.length() <= 1000 ? message : message.substring(0, 1000);
    }
}
