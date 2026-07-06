package com.antiadhd.focus.dto;

import jakarta.validation.constraints.Size;
import java.time.LocalDateTime;

public record FocusCompleteRequest(
        LocalDateTime endedAt,
        @Size(max = 1000) String note
) {
}

