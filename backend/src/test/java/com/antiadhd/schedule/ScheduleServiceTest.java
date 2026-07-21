package com.antiadhd.schedule;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.Mockito.when;

import com.antiadhd.category.CategoryService;
import com.antiadhd.common.exception.BadRequestException;
import com.antiadhd.schedule.dto.ScheduleRequest;
import com.antiadhd.schedule.dto.ScheduleResponse;
import com.antiadhd.tag.Tag;
import com.antiadhd.tag.TagRepository;
import com.antiadhd.user.AppUser;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class ScheduleServiceTest {
    @Mock
    ScheduleRepository scheduleRepository;

    @Mock
    CategoryService categoryService;

    @Mock
    TagRepository tagRepository;

    @InjectMocks
    ScheduleService scheduleService;

    @Test
    void create_mapsRequestAndDefaultsRepeatType() {
        AppUser user = user();
        ScheduleRequest request = request(RepeatType.NONE, Set.of());
        when(scheduleRepository.save(any(Schedule.class))).thenAnswer(invocation -> invocation.getArgument(0));

        ScheduleResponse response = scheduleService.create(user, request);

        assertThat(response.title()).isEqualTo("Focus block");
        assertThat(response.description()).isEqualTo("Deep work");
        assertThat(response.color()).isEqualTo("#2563eb");
        assertThat(response.repeatType()).isEqualTo(RepeatType.NONE);
        assertThat(response.tags()).isEmpty();
    }

    @Test
    void create_rejectsEndAtBeforeStartAt() {
        AppUser user = user();
        LocalDateTime start = LocalDateTime.of(2026, 7, 8, 10, 0);
        ScheduleRequest request = new ScheduleRequest(
                "Focus block",
                "Deep work",
                start,
                start.minusMinutes(1),
                "#2563eb",
                RepeatType.NONE,
                null,
                Set.of()
        );

        assertThatThrownBy(() -> scheduleService.create(user, request))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("End time must be after start time.");
    }

    @Test
    void create_rejectsTagIdsNotOwnedByUser() {
        AppUser user = user();
        when(tagRepository.findByUserAndIdIn(user, Set.of(1L, 2L))).thenReturn(List.of(tag(user)));

        assertThatThrownBy(() -> scheduleService.create(user, request(RepeatType.WEEKLY, Set.of(1L, 2L))))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("One or more tags are invalid.");
    }

    @Test
    void createBatch_savesAllSchedulesTogether() {
        AppUser user = user();
        List<ScheduleRequest> requests = List.of(
                request(RepeatType.NONE, Set.of()),
                new ScheduleRequest(
                        "Second block",
                        "Continue the plan",
                        LocalDateTime.of(2026, 7, 8, 10, 0),
                        LocalDateTime.of(2026, 7, 8, 10, 30),
                        "#f59e0b",
                        RepeatType.NONE,
                        null,
                        Set.of()
                )
        );
        when(scheduleRepository.saveAll(anyList())).thenAnswer(invocation -> invocation.getArgument(0));

        List<ScheduleResponse> responses = scheduleService.createBatch(user, requests);

        assertThat(responses).extracting(ScheduleResponse::title)
                .containsExactly("Focus block", "Second block");
        assertThat(responses).extracting(ScheduleResponse::startAt)
                .containsExactly(
                        LocalDateTime.of(2026, 7, 8, 9, 0),
                        LocalDateTime.of(2026, 7, 8, 10, 0)
                );
    }

    @Test
    void overdue_returnsOnlyRepositoryResultsInTimeOrder() {
        AppUser user = user();
        LocalDateTime before = LocalDateTime.of(2026, 7, 21, 12, 0);
        Schedule missed = new Schedule();
        missed.setUser(user);
        missed.setTitle("Missed block");
        missed.setStartAt(before.minusHours(2));
        missed.setEndAt(before.minusHours(1));
        missed.setColor("#2563eb");
        when(scheduleRepository.findByUserAndCompletedFalseAndEndAtBeforeOrderByStartAtAsc(user, before))
                .thenReturn(List.of(missed));

        List<ScheduleResponse> responses = scheduleService.overdue(user, before);

        assertThat(responses).extracting(ScheduleResponse::title).containsExactly("Missed block");
    }

    private ScheduleRequest request(RepeatType repeatType, Set<Long> tagIds) {
        return new ScheduleRequest(
                " Focus block ",
                " Deep work ",
                LocalDateTime.of(2026, 7, 8, 9, 0),
                LocalDateTime.of(2026, 7, 8, 10, 0),
                "#2563eb",
                repeatType,
                null,
                tagIds
        );
    }

    private AppUser user() {
        AppUser user = new AppUser();
        user.setEmail("test@example.com");
        user.setName("Test User");
        user.setPassword("encoded-password");
        return user;
    }

    private Tag tag(AppUser user) {
        Tag tag = new Tag();
        tag.setUser(user);
        tag.setName("Focus");
        tag.setColor("#64748b");
        return tag;
    }
}
