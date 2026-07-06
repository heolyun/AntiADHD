package com.antiadhd.review.dto;

import com.antiadhd.review.DailyReview;
import java.time.Instant;
import java.time.LocalDate;

public record DailyReviewResponse(
        Long id,
        LocalDate reviewDate,
        String mood,
        String summary,
        String accomplishment,
        String improvement,
        Instant createdAt,
        Instant updatedAt
) {
    public static DailyReviewResponse from(DailyReview review) {
        return new DailyReviewResponse(
                review.getId(),
                review.getReviewDate(),
                review.getMood(),
                review.getSummary(),
                review.getAccomplishment(),
                review.getImprovement(),
                review.getCreatedAt(),
                review.getUpdatedAt()
        );
    }
}

