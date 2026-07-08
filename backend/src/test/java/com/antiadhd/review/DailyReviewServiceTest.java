package com.antiadhd.review;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

import com.antiadhd.common.exception.ConflictException;
import com.antiadhd.review.dto.DailyReviewRequest;
import com.antiadhd.user.AppUser;
import java.time.LocalDate;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class DailyReviewServiceTest {
    @Mock
    DailyReviewRepository dailyReviewRepository;

    @InjectMocks
    DailyReviewService dailyReviewService;

    @Test
    void create_rejectsDuplicateReviewDateForUser() {
        AppUser user = user();
        LocalDate reviewDate = LocalDate.of(2026, 7, 8);
        when(dailyReviewRepository.existsByUserAndReviewDate(user, reviewDate)).thenReturn(true);

        assertThatThrownBy(() -> dailyReviewService.create(user, request(reviewDate)))
                .isInstanceOf(ConflictException.class)
                .hasMessage("Daily review already exists for this date.");
    }

    private DailyReviewRequest request(LocalDate reviewDate) {
        return new DailyReviewRequest(reviewDate, "Good", "Summary", "Done", "Improve");
    }

    private AppUser user() {
        AppUser user = new AppUser();
        user.setEmail("test@example.com");
        user.setName("Test User");
        user.setPassword("encoded-password");
        return user;
    }
}
