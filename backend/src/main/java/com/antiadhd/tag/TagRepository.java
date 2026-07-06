package com.antiadhd.tag;

import com.antiadhd.user.AppUser;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TagRepository extends JpaRepository<Tag, Long> {
    List<Tag> findByUserOrderByNameAsc(AppUser user);

    List<Tag> findByUserAndIdIn(AppUser user, Collection<Long> ids);

    Optional<Tag> findByIdAndUser(Long id, AppUser user);
}

