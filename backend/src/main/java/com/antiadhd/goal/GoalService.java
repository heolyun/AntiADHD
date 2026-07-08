package com.antiadhd.goal;

import com.antiadhd.common.exception.ResourceNotFoundException;
import com.antiadhd.goal.dto.GoalRequest;
import com.antiadhd.goal.dto.GoalResponse;
import com.antiadhd.user.AppUser;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class GoalService {
    private final GoalRepository goalRepository;

    public GoalService(GoalRepository goalRepository) {
        this.goalRepository = goalRepository;
    }

    @Transactional(readOnly = true)
    public List<GoalResponse> list(AppUser user) {
        return goalRepository.findByUserOrderByCreatedAtDesc(user).stream().map(GoalResponse::from).toList();
    }

    @Transactional
    public GoalResponse create(AppUser user, GoalRequest request) {
        Goal goal = new Goal();
        goal.setUser(user);
        apply(goal, request);
        return GoalResponse.from(goalRepository.save(goal));
    }

    @Transactional
    public GoalResponse update(AppUser user, Long id, GoalRequest request) {
        Goal goal = findOwned(user, id);
        apply(goal, request);
        return GoalResponse.from(goal);
    }

    @Transactional
    public void delete(AppUser user, Long id) {
        goalRepository.delete(findOwned(user, id));
    }

    private Goal findOwned(AppUser user, Long id) {
        return goalRepository.findByIdAndUser(id, user)
                .orElseThrow(() -> new ResourceNotFoundException("Goal not found."));
    }

    private void apply(Goal goal, GoalRequest request) {
        goal.setTitle(request.title().trim());
        goal.setDescription(request.description() == null ? null : request.description().trim());
        goal.setTargetDate(request.targetDate());
        goal.setProgress(request.progress());
        goal.setStatus(request.status() == null ? GoalStatus.TODO : request.status());
    }
}
