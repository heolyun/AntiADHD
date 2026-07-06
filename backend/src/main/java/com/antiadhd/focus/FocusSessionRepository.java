package com.antiadhd.focus;

import com.antiadhd.user.AppUser;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface FocusSessionRepository extends JpaRepository<FocusSession, Long> {
    List<FocusSession> findByUserOrderByStartedAtDesc(AppUser user);

    Optional<FocusSession> findByIdAndUser(Long id, AppUser user);
}

