package com.antiadhd.ai;

import com.antiadhd.ai.config.AiWorkerProperties;
import java.util.Optional;
import java.nio.file.Files;
import java.nio.file.Path;
import java.io.IOException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@ConditionalOnProperty(prefix = "app.ai.worker", name = "enabled", havingValue = "true")
public class AiJobWorker {
    private static final Logger log = LoggerFactory.getLogger(AiJobWorker.class);

    private final AiJobQueue queue;
    private final OpenAiTaskBreakdownClient client;
    private final OpenAiVoiceCommandClient voiceClient;
    private final AiJobStateService stateService;
    private final AiJobMetrics metrics;
    private final AiWorkerProperties properties;

    public AiJobWorker(
            AiJobQueue queue,
            OpenAiTaskBreakdownClient client,
            OpenAiVoiceCommandClient voiceClient,
            AiJobStateService stateService,
            AiJobMetrics metrics,
            AiWorkerProperties properties
    ) {
        this.queue = queue;
        this.client = client;
        this.voiceClient = voiceClient;
        this.stateService = stateService;
        this.metrics = metrics;
        this.properties = properties;
    }

    @Scheduled(fixedDelayString = "${app.ai.worker.poll-delay-ms:2000}")
    public void poll() {
        queue.recoverStaleJobs();
        Optional<AiJob> claimed = queue.claimNext();
        claimed.ifPresent(this::process);
    }

    private void process(AiJob job) {
        long startedAt = metrics.start();
        try {
            if (job.getJobType() == AiJobType.VOICE_COMMAND) {
                stateService.completeVoiceCommand(job.getId(), voiceClient.create(job));
                deleteAudio(job);
            } else {
                OpenAiTaskBreakdownResult result = client.create(job);
                stateService.complete(job.getId(), result);
            }
            metrics.completed(startedAt);
            log.info("AI job completed: jobId={}, attempt={}", job.getId(), job.getAttemptCount());
        } catch (OpenAiException exception) {
            AiJobStatus status = stateService.failOrRetry(job.getId(), exception, properties.getMaxAttempts());
            if (status == AiJobStatus.PENDING) {
                metrics.retried(startedAt);
                log.warn("AI job scheduled for retry: jobId={}, code={}, attempt={}",
                        job.getId(), exception.getCode(), job.getAttemptCount());
            } else {
                metrics.failed(startedAt);
                deleteAudio(job);
                log.error("AI job failed: jobId={}, code={}, attempt={}",
                        job.getId(), exception.getCode(), job.getAttemptCount());
            }
        } catch (RuntimeException exception) {
            OpenAiException failure = new OpenAiException(
                    "AI_WORKER_INTERNAL_ERROR",
                    "An internal AI worker error occurred.",
                    true,
                    exception
            );
            AiJobStatus status = stateService.failOrRetry(job.getId(), failure, properties.getMaxAttempts());
            if (status == AiJobStatus.PENDING) {
                metrics.retried(startedAt);
            } else {
                metrics.failed(startedAt);
                deleteAudio(job);
            }
            log.error("Unexpected AI worker error: jobId={}", job.getId(), exception);
        }
    }

    private void deleteAudio(AiJob job) {
        if (job.getAudioPath() == null) return;
        try {
            Files.deleteIfExists(Path.of(job.getAudioPath()));
        } catch (IOException exception) {
            log.warn("Unable to delete voice recording: jobId={}", job.getId(), exception);
        }
    }
}
