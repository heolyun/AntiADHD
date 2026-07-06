package com.antiadhd.review;

import com.antiadhd.user.AppUser;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DailyReviewRepository extends JpaRepository<DailyReview, Long> {
    List<DailyReview> findByUserOrderByReviewDateDesc(AppUser user);

    Optional<DailyReview> findByIdAndUser(Long id, AppUser user);

    Optional<DailyReview> findByUserAndReviewDate(AppUser user, LocalDate reviewDate);
}

