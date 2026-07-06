package com.antiadhd.goal;

import com.antiadhd.user.AppUser;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface GoalRepository extends JpaRepository<Goal, Long> {
    List<Goal> findByUserOrderByCreatedAtDesc(AppUser user);

    Optional<Goal> findByIdAndUser(Long id, AppUser user);
}

