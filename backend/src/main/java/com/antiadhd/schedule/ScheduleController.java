package com.antiadhd.schedule;

import com.antiadhd.schedule.dto.CompleteRequest;
import com.antiadhd.schedule.dto.ScheduleRequest;
import com.antiadhd.schedule.dto.ScheduleResponse;
import com.antiadhd.user.AppUser;
import jakarta.validation.Valid;
import java.time.Clock;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/schedules")
public class ScheduleController {
    private final ScheduleService scheduleService;
    private final Clock clock;

    public ScheduleController(ScheduleService scheduleService, Clock clock) {
        this.scheduleService = scheduleService;
        this.clock = clock;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ScheduleResponse create(
            @AuthenticationPrincipal AppUser user,
            @Valid @RequestBody ScheduleRequest request
    ) {
        return scheduleService.create(user, request);
    }

    @GetMapping
    public List<ScheduleResponse> list(
            @AuthenticationPrincipal AppUser user,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime to
    ) {
        LocalDate today = today();
        LocalDateTime rangeFrom = from == null ? today.atStartOfDay() : from;
        LocalDateTime rangeTo = to == null ? today.plusDays(31).atStartOfDay() : to;
        return scheduleService.findBetween(user, rangeFrom, rangeTo);
    }

    @GetMapping("/{id}")
    public ScheduleResponse get(@AuthenticationPrincipal AppUser user, @PathVariable Long id) {
        return scheduleService.get(user, id);
    }

    @PutMapping("/{id}")
    public ScheduleResponse update(
            @AuthenticationPrincipal AppUser user,
            @PathVariable Long id,
            @Valid @RequestBody ScheduleRequest request
    ) {
        return scheduleService.update(user, id, request);
    }

    @PatchMapping("/{id}/complete")
    public ScheduleResponse complete(
            @AuthenticationPrincipal AppUser user,
            @PathVariable Long id,
            @Valid @RequestBody CompleteRequest request
    ) {
        return scheduleService.complete(user, id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@AuthenticationPrincipal AppUser user, @PathVariable Long id) {
        scheduleService.delete(user, id);
    }

    @GetMapping("/today")
    public List<ScheduleResponse> today(
            @AuthenticationPrincipal AppUser user,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date
    ) {
        return scheduleService.today(user, date == null ? today() : date);
    }

    @GetMapping("/week")
    public List<ScheduleResponse> week(
            @AuthenticationPrincipal AppUser user,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date
    ) {
        return scheduleService.week(user, date == null ? today() : date);
    }

    @GetMapping("/month")
    public List<ScheduleResponse> month(
            @AuthenticationPrincipal AppUser user,
            @RequestParam(required = false) Integer year,
            @RequestParam(required = false) Integer month
    ) {
        LocalDate now = today();
        return scheduleService.month(user, year == null ? now.getYear() : year, month == null ? now.getMonthValue() : month);
    }

    private LocalDate today() {
        return LocalDate.now(clock);
    }
}
