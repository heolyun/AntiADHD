package com.antiadhd.schedule;

import com.antiadhd.user.AppUser;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ScheduleRepository extends JpaRepository<Schedule, Long> {
    @EntityGraph(attributePaths = {"category", "tags"})
    Optional<Schedule> findByIdAndUser(Long id, AppUser user);

    @EntityGraph(attributePaths = {"category", "tags"})
    List<Schedule> findByUserAndStartAtLessThanAndEndAtGreaterThanEqualOrderByStartAtAsc(
            AppUser user,
            LocalDateTime rangeEndExclusive,
            LocalDateTime rangeStartInclusive
    );
}
