package com.antiadhd.schedule;

import com.antiadhd.category.CategoryService;
import com.antiadhd.common.exception.BadRequestException;
import com.antiadhd.common.exception.ResourceNotFoundException;
import com.antiadhd.schedule.dto.CompleteRequest;
import com.antiadhd.schedule.dto.ScheduleRequest;
import com.antiadhd.schedule.dto.ScheduleResponse;
import com.antiadhd.tag.Tag;
import com.antiadhd.tag.TagRepository;
import com.antiadhd.user.AppUser;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ScheduleService {
    private final ScheduleRepository scheduleRepository;
    private final CategoryService categoryService;
    private final TagRepository tagRepository;

    public ScheduleService(ScheduleRepository scheduleRepository, CategoryService categoryService, TagRepository tagRepository) {
        this.scheduleRepository = scheduleRepository;
        this.categoryService = categoryService;
        this.tagRepository = tagRepository;
    }

    @Transactional
    public ScheduleResponse create(AppUser user, ScheduleRequest request) {
        Schedule schedule = build(user, request);
        return ScheduleResponse.from(scheduleRepository.save(schedule));
    }

    @Transactional
    public List<ScheduleResponse> createBatch(AppUser user, List<ScheduleRequest> requests) {
        List<Schedule> schedules = requests.stream()
                .map(request -> build(user, request))
                .toList();
        return scheduleRepository.saveAll(schedules).stream()
                .map(ScheduleResponse::from)
                .toList();
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
                .orElseThrow(() -> new ResourceNotFoundException("Schedule not found."));
    }

    @Transactional(readOnly = true)
    public List<ScheduleResponse> overdue(AppUser user, LocalDateTime before) {
        return scheduleRepository.findByUserAndCompletedFalseAndEndAtBeforeOrderByStartAtAsc(user, before)
                .stream()
                .map(ScheduleResponse::from)
                .toList();
    }

    private Schedule build(AppUser user, ScheduleRequest request) {
        Schedule schedule = new Schedule();
        schedule.setUser(user);
        apply(schedule, request);
        return schedule;
    }

    private void apply(Schedule schedule, ScheduleRequest request) {
        if (!request.endAt().isAfter(request.startAt())) {
            throw new BadRequestException("End time must be after start time.");
        }
        schedule.setTitle(request.title().trim());
        schedule.setDescription(request.description() == null ? null : request.description().trim());
        schedule.setStartAt(request.startAt());
        schedule.setEndAt(request.endAt());
        schedule.setColor(request.color());
        schedule.setRepeatType(request.repeatType() == null ? RepeatType.NONE : request.repeatType());
        schedule.setCategory(request.categoryId() == null ? null : categoryService.findOwned(schedule.getUser(), request.categoryId()));
        schedule.setTags(resolveTags(schedule.getUser(), request.tagIds()));
    }

    private Set<Tag> resolveTags(AppUser user, Set<Long> tagIds) {
        if (tagIds == null || tagIds.isEmpty()) {
            return new LinkedHashSet<>();
        }
        List<Tag> tags = tagRepository.findByUserAndIdIn(user, tagIds);
        if (tags.size() != tagIds.size()) {
            throw new BadRequestException("One or more tags are invalid.");
        }
        return new LinkedHashSet<>(tags);
    }

}
