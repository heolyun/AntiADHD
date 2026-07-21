package com.antiadhd.routine;

import com.antiadhd.user.AppUser;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RoutineRepository extends JpaRepository<Routine, Long> {
    List<Routine> findByUserOrderByCreatedAtDesc(AppUser user);

    Optional<Routine> findByIdAndUser(Long id, AppUser user);

    List<Routine> findByUserAndActiveTrue(AppUser user);
}

