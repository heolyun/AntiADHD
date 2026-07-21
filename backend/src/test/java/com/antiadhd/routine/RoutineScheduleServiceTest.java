package com.antiadhd.routine;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

import com.antiadhd.schedule.RepeatType;
import com.antiadhd.schedule.Schedule;
import com.antiadhd.schedule.ScheduleRepository;
import com.antiadhd.schedule.dto.ScheduleResponse;
import com.antiadhd.user.AppUser;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

@ExtendWith(MockitoExtension.class)
class RoutineScheduleServiceTest {
    @Mock
    RoutineRepository routineRepository;
    @Mock
    ScheduleRepository scheduleRepository;
    @InjectMocks
    RoutineScheduleService service;

    @Test
    void materialize_createsOneIdempotentDailyOccurrence() {
        AppUser user = new AppUser();
        Routine routine = new Routine();
        routine.setUser(user);
        routine.setTitle("Morning planning");
        routine.setRepeatType(RepeatType.DAILY);
        routine.setTargetTime(LocalTime.of(8, 30));
        routine.setDurationMinutes(25);
        routine.setActive(true);
        ReflectionTestUtils.setField(routine, "createdAt", Instant.parse("2026-07-20T00:00:00Z"));
        LocalDate date = LocalDate.of(2026, 7, 21);
        when(routineRepository.findByUserAndActiveTrue(user)).thenReturn(List.of(routine));
        when(scheduleRepository.existsByRoutineAndRoutineDate(routine, date)).thenReturn(false);
        when(scheduleRepository.save(any(Schedule.class))).thenAnswer(invocation -> invocation.getArgument(0));

        List<ScheduleResponse> result = service.materialize(user, date);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).startAt()).isEqualTo(LocalDateTime.of(2026, 7, 21, 8, 30));
        assertThat(result.get(0).endAt()).isEqualTo(LocalDateTime.of(2026, 7, 21, 8, 55));
    }
}
