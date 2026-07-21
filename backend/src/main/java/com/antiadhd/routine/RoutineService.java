package com.antiadhd.routine;

import com.antiadhd.common.exception.ResourceNotFoundException;
import com.antiadhd.routine.dto.RoutineRequest;
import com.antiadhd.routine.dto.RoutineResponse;
import com.antiadhd.schedule.RepeatType;
import com.antiadhd.user.AppUser;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class RoutineService {
    private final RoutineRepository routineRepository;

    public RoutineService(RoutineRepository routineRepository) {
        this.routineRepository = routineRepository;
    }

    @Transactional(readOnly = true)
    public List<RoutineResponse> list(AppUser user) {
        return routineRepository.findByUserOrderByCreatedAtDesc(user).stream().map(RoutineResponse::from).toList();
    }

    @Transactional
    public RoutineResponse create(AppUser user, RoutineRequest request) {
        Routine routine = new Routine();
        routine.setUser(user);
        apply(routine, request);
        return RoutineResponse.from(routineRepository.save(routine));
    }

    @Transactional
    public RoutineResponse update(AppUser user, Long id, RoutineRequest request) {
        Routine routine = findOwned(user, id);
        apply(routine, request);
        return RoutineResponse.from(routine);
    }

    @Transactional
    public void delete(AppUser user, Long id) {
        routineRepository.delete(findOwned(user, id));
    }

    private Routine findOwned(AppUser user, Long id) {
        return routineRepository.findByIdAndUser(id, user)
                .orElseThrow(() -> new ResourceNotFoundException("Routine not found."));
    }

    private void apply(Routine routine, RoutineRequest request) {
        routine.setTitle(request.title().trim());
        routine.setDescription(request.description() == null ? null : request.description().trim());
        routine.setRepeatType(request.repeatType() == null ? RepeatType.DAILY : request.repeatType());
        routine.setTargetTime(request.targetTime());
        routine.setDurationMinutes(request.durationMinutes() == 0 ? 30 : request.durationMinutes());
        routine.setActive(request.active());
    }
}
