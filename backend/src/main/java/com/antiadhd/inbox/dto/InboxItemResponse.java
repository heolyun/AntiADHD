package com.antiadhd.inbox.dto;

import com.antiadhd.inbox.InboxItem;
import com.antiadhd.inbox.InboxPriority;
import com.antiadhd.inbox.InboxStatus;
import java.time.Instant;

public record InboxItemResponse(
        Long id,
        String title,
        String description,
        Integer estimatedMinutes,
        InboxPriority priority,
        InboxStatus status,
        Instant createdAt,
        Instant updatedAt
) {
    public static InboxItemResponse from(InboxItem item) {
        return new InboxItemResponse(
                item.getId(),
                item.getTitle(),
                item.getDescription(),
                item.getEstimatedMinutes(),
                item.getPriority(),
                item.getStatus(),
                item.getCreatedAt(),
                item.getUpdatedAt()
        );
    }
}
