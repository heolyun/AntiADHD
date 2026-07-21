package com.antiadhd.inbox.dto;

import com.antiadhd.inbox.InboxPriority;
import com.antiadhd.inbox.InboxStatus;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record InboxItemRequest(
        @NotBlank @Size(max = 120) String title,
        @Size(max = 1000) String description,
        @Min(1) @Max(480) Integer estimatedMinutes,
        InboxPriority priority,
        InboxStatus status
) {
}
