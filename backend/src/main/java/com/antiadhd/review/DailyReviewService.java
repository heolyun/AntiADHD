package com.antiadhd.review;

import com.antiadhd.common.exception.ConflictException;
import com.antiadhd.common.exception.ResourceNotFoundException;
import com.antiadhd.review.dto.DailyReviewRequest;
import com.antiadhd.review.dto.DailyReviewResponse;
import com.antiadhd.user.AppUser;
import java.time.LocalDate;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class DailyReviewService {
    private final DailyReviewRepository dailyReviewRepository;

    public DailyReviewService(DailyReviewRepository dailyReviewRepository) {
        this.dailyReviewRepository = dailyReviewRepository;
    }

    @Transactional(readOnly = true)
    public List<DailyReviewResponse> list(AppUser user) {
        return dailyReviewRepository.findByUserOrderByReviewDateDesc(user).stream().map(DailyReviewResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public DailyReviewResponse getByDate(AppUser user, LocalDate date) {
        return dailyReviewRepository.findByUserAndReviewDate(user, date).map(DailyReviewResponse::from)
                .orElseThrow(() -> new ResourceNotFoundException("Daily review not found."));
    }

    @Transactional
    public DailyReviewResponse create(AppUser user, DailyReviewRequest request) {
        if (dailyReviewRepository.existsByUserAndReviewDate(user, request.reviewDate())) {
            throw new ConflictException("Daily review already exists for this date.");
        }

        DailyReview review = new DailyReview();
        review.setUser(user);
        apply(review, request);
        return DailyReviewResponse.from(dailyReviewRepository.save(review));
    }

    @Transactional
    public DailyReviewResponse update(AppUser user, Long id, DailyReviewRequest request) {
        DailyReview review = findOwned(user, id);
        apply(review, request);
        return DailyReviewResponse.from(review);
    }

    @Transactional
    public void delete(AppUser user, Long id) {
        dailyReviewRepository.delete(findOwned(user, id));
    }

    private DailyReview findOwned(AppUser user, Long id) {
        return dailyReviewRepository.findByIdAndUser(id, user)
                .orElseThrow(() -> new ResourceNotFoundException("Daily review not found."));
    }

    private void apply(DailyReview review, DailyReviewRequest request) {
        review.setReviewDate(request.reviewDate());
        review.setMood(trim(request.mood()));
        review.setSummary(trim(request.summary()));
        review.setAccomplishment(trim(request.accomplishment()));
        review.setImprovement(trim(request.improvement()));
    }

    private String trim(String value) {
        return value == null ? null : value.trim();
    }
}
