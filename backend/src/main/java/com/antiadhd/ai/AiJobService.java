package com.antiadhd.ai;

import com.antiadhd.ai.dto.AiJobAcceptedResponse;
import com.antiadhd.ai.dto.AiJobResponse;
import com.antiadhd.ai.dto.CreateTaskBreakdownRequest;
import com.antiadhd.ai.dto.TaskBreakdownResult;
import com.antiadhd.ai.dto.VoiceCommandJobResponse;
import com.antiadhd.ai.dto.VoiceCommandResult;
import com.antiadhd.ai.config.AiUsageProperties;
import com.antiadhd.common.exception.BadRequestException;
import com.antiadhd.common.exception.ResourceNotFoundException;
import com.antiadhd.common.exception.TooManyRequestsException;
import com.antiadhd.user.AppUser;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.MeterRegistry;
import java.time.Clock;
import java.time.Instant;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AiJobService {
    private final AiJobRepository aiJobRepository;
    private final ObjectMapper objectMapper;
    private final Clock clock;
    private final AiUsageProperties usageProperties;
    private final Counter createdCounter;
    private final Path voiceStoragePath;

    @Autowired
    public AiJobService(
            AiJobRepository aiJobRepository,
            ObjectMapper objectMapper,
            Clock clock,
            AiUsageProperties usageProperties,
            MeterRegistry meterRegistry,
            @Value("${app.ai.voice.storage-path:/tmp/antiadhd-voice}") String voiceStoragePath
    ) {
        this.aiJobRepository = aiJobRepository;
        this.objectMapper = objectMapper;
        this.clock = clock;
        this.usageProperties = usageProperties;
        this.createdCounter = Counter.builder("antiadhd.ai.jobs.created")
                .tag("type", "task_breakdown")
                .register(meterRegistry);
        this.voiceStoragePath = Path.of(voiceStoragePath).toAbsolutePath().normalize();
    }

    AiJobService(
            AiJobRepository aiJobRepository,
            ObjectMapper objectMapper,
            Clock clock,
            AiUsageProperties usageProperties,
            MeterRegistry meterRegistry
    ) {
        this(aiJobRepository, objectMapper, clock, usageProperties, meterRegistry,
                System.getProperty("java.io.tmpdir") + "/antiadhd-voice-test");
    }

    @Transactional
    public AiJobAcceptedResponse createVoiceCommand(AppUser user, MultipartFile audio) {
        enforceDailyLimit(user);
        if (audio.isEmpty() || audio.getSize() > 6 * 1024 * 1024) {
            throw new BadRequestException("Voice recording must be between 1 byte and 6 MB.");
        }
        String contentType = audio.getContentType();
        if (contentType == null || !contentType.startsWith("audio/")) {
            throw new BadRequestException("Only audio recordings are supported.");
        }
        Path target = voiceStoragePath.resolve(UUID.randomUUID() + audioExtension(contentType)).normalize();
        if (!target.startsWith(voiceStoragePath)) {
            throw new BadRequestException("Invalid voice recording path.");
        }
        try {
            Files.createDirectories(voiceStoragePath);
            audio.transferTo(target);
            AiJob job = new AiJob();
            job.setUser(user);
            job.setJobType(AiJobType.VOICE_COMMAND);
            job.setStatus(AiJobStatus.PENDING);
            job.setGoal("Voice command");
            job.setAudioPath(target.toString());
            job.setNextAttemptAt(Instant.now(clock));
            return AiJobAcceptedResponse.from(aiJobRepository.save(job));
        } catch (IOException exception) {
            throw new IllegalStateException("Unable to store the voice recording.", exception);
        }
    }

    private String audioExtension(String contentType) {
        if (contentType.contains("webm")) return ".webm";
        if (contentType.contains("wav")) return ".wav";
        if (contentType.contains("mpeg")) return ".mp3";
        return ".m4a";
    }

    @Transactional(readOnly = true)
    public VoiceCommandJobResponse getVoiceCommand(AppUser user, UUID id) {
        AiJob job = aiJobRepository.findByIdAndUser(id, user)
                .filter(item -> item.getJobType() == AiJobType.VOICE_COMMAND)
                .orElseThrow(() -> new ResourceNotFoundException("Voice command job not found."));
        VoiceCommandResult result = null;
        if (job.getResultJson() != null) {
            try {
                result = objectMapper.readValue(job.getResultJson(), VoiceCommandResult.class);
            } catch (JsonProcessingException exception) {
                throw new IllegalStateException("Stored voice command result is invalid.", exception);
            }
        }
        return new VoiceCommandJobResponse(job.getId(), job.getStatus(), result, job.getFailureCode(),
                job.getFailureMessage(), job.getAttemptCount(), job.getCreatedAt(), job.getCompletedAt());
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
