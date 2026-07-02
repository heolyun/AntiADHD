package com.antiadhd.schedule;

import com.antiadhd.schedule.dto.CompleteRequest;
import com.antiadhd.schedule.dto.ScheduleRequest;
import com.antiadhd.schedule.dto.ScheduleResponse;
import com.antiadhd.user.AppUser;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class ScheduleService {
    private final ScheduleRepository scheduleRepository;

    public ScheduleService(ScheduleRepository scheduleRepository) {
        this.scheduleRepository = scheduleRepository;
    }

    @Transactional
    public ScheduleResponse create(AppUser user, ScheduleRequest request) {
        Schedule schedule = new Schedule();
        schedule.setUser(user);
        apply(schedule, request);
        return ScheduleResponse.from(scheduleRepository.save(schedule));
    }

    @Transactional(readOnly = true)
    public ScheduleResponse get(AppUser user, Long id) {
        return ScheduleResponse.from(findOwned(user, id));
    }

    @Transactional(readOnly = true)
    public List<ScheduleResponse> findBetween(AppUser user, LocalDateTime from, LocalDateTime to) {
        return scheduleRepository
                .findByUserAndStartAtLessThanAndEndAtGreaterThanEqualOrderByStartAtAsc(user, to, from)
                .stream()
                .map(ScheduleResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<ScheduleResponse> today(AppUser user, LocalDate date) {
        return findBetween(user, date.atStartOfDay(), date.plusDays(1).atStartOfDay());
    }

    @Transactional(readOnly = true)
    public List<ScheduleResponse> week(AppUser user, LocalDate date) {
        LocalDate monday = date.with(DayOfWeek.MONDAY);
        return findBetween(user, monday.atStartOfDay(), monday.plusDays(7).atStartOfDay());
    }

    @Transactional(readOnly = true)
    public List<ScheduleResponse> month(AppUser user, int year, int month) {
        YearMonth yearMonth = YearMonth.of(year, month);
        return findBetween(user, yearMonth.atDay(1).atStartOfDay(), yearMonth.plusMonths(1).atDay(1).atStartOfDay());
    }

    @Transactional
    public ScheduleResponse update(AppUser user, Long id, ScheduleRequest request) {
        Schedule schedule = findOwned(user, id);
        apply(schedule, request);
        return ScheduleResponse.from(schedule);
    }

    @Transactional
    public ScheduleResponse complete(AppUser user, Long id, CompleteRequest request) {
        Schedule schedule = findOwned(user, id);
        schedule.setCompleted(request.completed());
        return ScheduleResponse.from(schedule);
    }

    @Transactional
    public void delete(AppUser user, Long id) {
        scheduleRepository.delete(findOwned(user, id));
    }

    private Schedule findOwned(AppUser user, Long id) {
        return scheduleRepository.findByIdAndUser(id, user)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Schedule not found."));
    }

    private void apply(Schedule schedule, ScheduleRequest request) {
        if (!request.endAt().isAfter(request.startAt())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "End time must be after start time.");
        }
        schedule.setTitle(request.title().trim());
        schedule.setDescription(request.description() == null ? null : request.description().trim());
        schedule.setStartAt(request.startAt());
        schedule.setEndAt(request.endAt());
        schedule.setColor(request.color());
        schedule.setRepeatType(request.repeatType() == null ? RepeatType.NONE : request.repeatType());
    }

}
