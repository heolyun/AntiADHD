package com.antiadhd.inbox;

import com.antiadhd.user.AppUser;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.Instant;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

@Entity
@Table(name = "inbox_items", indexes = @Index(name = "idx_inbox_items_user_status_created", columnList = "user_id,status,created_at"))
public class InboxItem {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private AppUser user;

    @Column(nullable = false, length = 120)
    private String title;

    @Column(length = 1000)
    private String description;

    private Integer estimatedMinutes;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private InboxPriority priority = InboxPriority.MEDIUM;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private InboxStatus status = InboxStatus.INBOX;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(nullable = false)
    private Instant updatedAt;

    public Long getId() { return id; }
    public AppUser getUser() { return user; }
    public void setUser(AppUser user) { this.user = user; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public Integer getEstimatedMinutes() { return estimatedMinutes; }
    public void setEstimatedMinutes(Integer estimatedMinutes) { this.estimatedMinutes = estimatedMinutes; }
    public InboxPriority getPriority() { return priority; }
    public void setPriority(InboxPriority priority) { this.priority = priority; }
    public InboxStatus getStatus() { return status; }
    public void setStatus(InboxStatus status) { this.status = status; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
}
