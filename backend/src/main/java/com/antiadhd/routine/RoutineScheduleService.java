package com.antiadhd.routine;

import com.antiadhd.schedule.RepeatType;
import com.antiadhd.schedule.Schedule;
import com.antiadhd.schedule.ScheduleRepository;
import com.antiadhd.schedule.dto.ScheduleResponse;
import com.antiadhd.user.AppUser;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class RoutineScheduleService {
    private static final ZoneId SERVICE_ZONE = ZoneId.of("Asia/Seoul");
    private final RoutineRepository routineRepository;
    private final ScheduleRepository scheduleRepository;

    public RoutineScheduleService(RoutineRepository routineRepository, ScheduleRepository scheduleRepository) {
        this.routineRepository = routineRepository;
        this.scheduleRepository = scheduleRepository;
    }

    @Transactional
    public List<ScheduleResponse> materialize(AppUser user, LocalDate date) {
        List<Schedule> created = new ArrayList<>();
        for (Routine routine : routineRepository.findByUserAndActiveTrue(user)) {
            if (!occursOn(routine, date) || scheduleRepository.existsByRoutineAndRoutineDate(routine, date)) continue;
            LocalDateTime start = date.atTime(routine.getTargetTime() == null ? LocalTime.of(9, 0) : routine.getTargetTime());
            Schedule schedule = new Schedule();
            schedule.setUser(user);
            schedule.setTitle(routine.getTitle());
            schedule.setDescription(routine.getDescription());
            schedule.setStartAt(start);
            schedule.setEndAt(start.plusMinutes(routine.getDurationMinutes()));
            schedule.setColor("#8b5cf6");
            schedule.setRepeatType(RepeatType.NONE);
            schedule.setRoutine(routine);
            schedule.setRoutineDate(date);
            created.add(scheduleRepository.save(schedule));
        }
        return created.stream().map(ScheduleResponse::from).toList();
    }

    private boolean occursOn(Routine routine, LocalDate date) {
        LocalDate createdDate = routine.getCreatedAt().atZone(SERVICE_ZONE).toLocalDate();
        return switch (routine.getRepeatType()) {
            case DAILY -> !date.isBefore(createdDate);
            case WEEKLY -> !date.isBefore(createdDate) && date.getDayOfWeek() == createdDate.getDayOfWeek();
            case MONTHLY -> !date.isBefore(createdDate) && date.getDayOfMonth() == createdDate.getDayOfMonth();
            case NONE -> date.equals(createdDate);
        };
    }
}
