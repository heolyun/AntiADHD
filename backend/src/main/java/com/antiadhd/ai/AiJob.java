package com.antiadhd.ai;

import com.antiadhd.user.AppUser;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.Version;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

@Entity
@Table(
        name = "ai_jobs",
        indexes = {
                @Index(name = "idx_ai_jobs_user_created", columnList = "user_id,created_at"),
                @Index(name = "idx_ai_jobs_queue", columnList = "status,next_attempt_at,created_at")
        }
)
public class AiJob {
    @Id
    private UUID id = UUID.randomUUID();

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private AppUser user;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 40)
    private AiJobType jobType;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private AiJobStatus status;

    @Column(nullable = false, length = 1000)
    private String goal;

    private LocalDate deadline;

    private Integer availableMinutes;

    @Column(length = 500)
    private String audioPath;

    @Column(columnDefinition = "text")
    private String resultJson;

    @Column(length = 120)
    private String providerResponseId;

    @Column(length = 80)
    private String model;

    @Column(length = 80)
    private String failureCode;

    @Column(length = 1000)
    private String failureMessage;

    @Column(nullable = false)
    private int attemptCount;

    @Column(nullable = false)
    private Instant nextAttemptAt;

    private Instant claimedAt;

    private Instant startedAt;

    private Instant completedAt;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(nullable = false)
    private Instant updatedAt;

    @Version
    @Column(nullable = false)
    private long version;

    public UUID getId() { return id; }
    public AppUser getUser() { return user; }
    public void setUser(AppUser user) { this.user = user; }
    public AiJobType getJobType() { return jobType; }
    public void setJobType(AiJobType jobType) { this.jobType = jobType; }
    public AiJobStatus getStatus() { return status; }
    public void setStatus(AiJobStatus status) { this.status = status; }
    public String getGoal() { return goal; }
    public void setGoal(String goal) { this.goal = goal; }
    public LocalDate getDeadline() { return deadline; }
    public void setDeadline(LocalDate deadline) { this.deadline = deadline; }
    public Integer getAvailableMinutes() { return availableMinutes; }
    public void setAvailableMinutes(Integer availableMinutes) { this.availableMinutes = availableMinutes; }
    public String getAudioPath() { return audioPath; }
    public void setAudioPath(String audioPath) { this.audioPath = audioPath; }
    public String getResultJson() { return resultJson; }
    public void setResultJson(String resultJson) { this.resultJson = resultJson; }
    public String getProviderResponseId() { return providerResponseId; }
    public void setProviderResponseId(String providerResponseId) { this.providerResponseId = providerResponseId; }
    public String getModel() { return model; }
    public void setModel(String model) { this.model = model; }
    public String getFailureCode() { return failureCode; }
    public void setFailureCode(String failureCode) { this.failureCode = failureCode; }
    public String getFailureMessage() { return failureMessage; }
    public void setFailureMessage(String failureMessage) { this.failureMessage = failureMessage; }
    public int getAttemptCount() { return attemptCount; }
    public Instant getNextAttemptAt() { return nextAttemptAt; }
    public void setNextAttemptAt(Instant nextAttemptAt) { this.nextAttemptAt = nextAttemptAt; }
    public Instant getClaimedAt() { return claimedAt; }
    public void setClaimedAt(Instant claimedAt) { this.claimedAt = claimedAt; }
    public Instant getStartedAt() { return startedAt; }
    public void setStartedAt(Instant startedAt) { this.startedAt = startedAt; }
    public Instant getCompletedAt() { return completedAt; }
    public void setCompletedAt(Instant completedAt) { this.completedAt = completedAt; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
}
