package com.antiadhd.routine;

import com.antiadhd.routine.dto.RoutineRequest;
import com.antiadhd.routine.dto.RoutineResponse;
import com.antiadhd.user.AppUser;
import jakarta.validation.Valid;
import java.util.List;
import java.time.LocalDate;
import java.time.Clock;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.RequestParam;
import com.antiadhd.schedule.dto.ScheduleResponse;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/routines")
public class RoutineController {
    private final RoutineService routineService;
    private final RoutineScheduleService routineScheduleService;
    private final Clock clock;

    public RoutineController(RoutineService routineService, RoutineScheduleService routineScheduleService, Clock clock) {
        this.routineService = routineService;
        this.routineScheduleService = routineScheduleService;
        this.clock = clock;
    }

    @GetMapping
    public List<RoutineResponse> list(@AuthenticationPrincipal AppUser user) {
        return routineService.list(user);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public RoutineResponse create(@AuthenticationPrincipal AppUser user, @Valid @RequestBody RoutineRequest request) {
        return routineService.create(user, request);
    }

    @PostMapping("/materialize")
    public List<ScheduleResponse> materialize(
            @AuthenticationPrincipal AppUser user,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date
    ) {
        return routineScheduleService.materialize(user, date == null ? LocalDate.now(clock) : date);
    }

    @PutMapping("/{id}")
    public RoutineResponse update(@AuthenticationPrincipal AppUser user, @PathVariable Long id, @Valid @RequestBody RoutineRequest request) {
        return routineService.update(user, id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@AuthenticationPrincipal AppUser user, @PathVariable Long id) {
        routineService.delete(user, id);
    }
}

