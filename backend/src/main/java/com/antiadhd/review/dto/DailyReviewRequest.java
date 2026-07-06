package com.antiadhd.review.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;

public record DailyReviewRequest(
        @NotNull LocalDate reviewDate,
        @Size(max = 40) String mood,
        @Size(max = 1000) String summary,
        @Size(max = 1000) String accomplishment,
        @Size(max = 1000) String improvement
) {
}

