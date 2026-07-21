package com.antiadhd.ai;

import com.antiadhd.user.AppUser;
import java.time.Instant;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface AiJobRepository extends JpaRepository<AiJob, UUID> {
    Optional<AiJob> findByIdAndUser(UUID id, AppUser user);

    long countByStatus(AiJobStatus status);

    long countByUserAndJobTypeAndCreatedAtGreaterThanEqualAndCreatedAtLessThan(
            AppUser user,
            AiJobType jobType,
            Instant start,
            Instant end
    );

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query(value = """
            UPDATE ai_jobs
               SET status = 'PENDING',
                   claimed_at = NULL,
                   next_attempt_at = :now,
                   failure_code = 'WORKER_INTERRUPTED',
                   failure_message = 'The worker stopped before completing the job.',
                   updated_at = :now,
                   version = version + 1
             WHERE status = 'PROCESSING'
               AND claimed_at < :cutoff
               AND attempt_count < :maxAttempts
            """, nativeQuery = true)
    int requeueStaleJobs(
            @Param("cutoff") Instant cutoff,
            @Param("now") Instant now,
            @Param("maxAttempts") int maxAttempts
    );

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query(value = """
            UPDATE ai_jobs
               SET status = 'FAILED',
                   completed_at = :now,
                   failure_code = 'WORKER_RETRY_EXHAUSTED',
                   failure_message = 'The worker stopped and the retry limit was exhausted.',
                   updated_at = :now,
                   version = version + 1
             WHERE status = 'PROCESSING'
               AND claimed_at < :cutoff
               AND attempt_count >= :maxAttempts
            """, nativeQuery = true)
    int failExhaustedStaleJobs(
            @Param("cutoff") Instant cutoff,
            @Param("now") Instant now,
            @Param("maxAttempts") int maxAttempts
    );
}
