package com.antiadhd.review;

import com.antiadhd.review.dto.DailyReviewRequest;
import com.antiadhd.review.dto.DailyReviewResponse;
import com.antiadhd.user.AppUser;
import jakarta.validation.Valid;
import java.time.LocalDate;
import java.util.List;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/daily-reviews")
public class DailyReviewController {
    private final DailyReviewService dailyReviewService;

    public DailyReviewController(DailyReviewService dailyReviewService) {
        this.dailyReviewService = dailyReviewService;
    }

    @GetMapping
    public List<DailyReviewResponse> list(@AuthenticationPrincipal AppUser user) {
        return dailyReviewService.list(user);
    }

    @GetMapping("/by-date")
    public DailyReviewResponse byDate(
            @AuthenticationPrincipal AppUser user,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date
    ) {
        return dailyReviewService.getByDate(user, date);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public DailyReviewResponse create(@AuthenticationPrincipal AppUser user, @Valid @RequestBody DailyReviewRequest request) {
        return dailyReviewService.create(user, request);
    }

    @PutMapping("/{id}")
    public DailyReviewResponse update(@AuthenticationPrincipal AppUser user, @PathVariable Long id, @Valid @RequestBody DailyReviewRequest request) {
        return dailyReviewService.update(user, id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@AuthenticationPrincipal AppUser user, @PathVariable Long id) {
        dailyReviewService.delete(user, id);
    }
}

