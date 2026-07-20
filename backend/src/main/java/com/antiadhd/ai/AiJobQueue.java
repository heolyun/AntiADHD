package com.antiadhd.ai;

import com.antiadhd.ai.config.AiWorkerProperties;
import jakarta.persistence.EntityManager;
import java.time.Clock;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Optional;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
public class AiJobQueue {
    private final EntityManager entityManager;
    private final AiJobRepository aiJobRepository;
    private final AiWorkerProperties properties;
    private final Clock clock;

    public AiJobQueue(
            EntityManager entityManager,
            AiJobRepository aiJobRepository,
            AiWorkerProperties properties,
            Clock clock
    ) {
        this.entityManager = entityManager;
        this.aiJobRepository = aiJobRepository;
        this.properties = properties;
        this.clock = clock;
    }

    @Transactional
    public Optional<AiJob> claimNext() {
        Instant now = Instant.now(clock);
        return entityManager.createNativeQuery("""
                        WITH candidate AS (
                            SELECT id
                              FROM ai_jobs
                             WHERE status = 'PENDING'
                               AND next_attempt_at <= :now
                               AND attempt_count < :maxAttempts
                             ORDER BY created_at
                             FOR UPDATE SKIP LOCKED
                             LIMIT 1
                        )
                        UPDATE ai_jobs job
                           SET status = 'PROCESSING',
                               attempt_count = attempt_count + 1,
                               claimed_at = :now,
                               started_at = COALESCE(started_at, :now),
                               failure_code = NULL,
                               failure_message = NULL,
                               updated_at = :now,
                               version = version + 1
                          FROM candidate
                         WHERE job.id = candidate.id
                        RETURNING job.*
                        """, AiJob.class)
                .setParameter("now", now)
                .setParameter("maxAttempts", properties.getMaxAttempts())
                .getResultStream()
                .map(AiJob.class::cast)
                .findFirst();
    }

    @Transactional
    public void recoverStaleJobs() {
        Instant now = Instant.now(clock);
        Instant cutoff = now.minus(properties.getStaleAfterSeconds(), ChronoUnit.SECONDS);
        aiJobRepository.requeueStaleJobs(cutoff, now, properties.getMaxAttempts());
        aiJobRepository.failExhaustedStaleJobs(cutoff, now, properties.getMaxAttempts());
    }
}
