package com.antiadhd.schedule;

import com.antiadhd.user.AppUser;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ScheduleRepository extends JpaRepository<Schedule, Long> {
    Optional<Schedule> findByIdAndUser(Long id, AppUser user);

    List<Schedule> findByUserAndStartAtLessThanAndEndAtGreaterThanEqualOrderByStartAtAsc(
            AppUser user,
            LocalDateTime rangeEndExclusive,
            LocalDateTime rangeStartInclusive
    );
}

