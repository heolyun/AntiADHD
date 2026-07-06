package com.antiadhd.category;

import com.antiadhd.user.AppUser;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CategoryRepository extends JpaRepository<Category, Long> {
    List<Category> findByUserOrderByNameAsc(AppUser user);

    Optional<Category> findByIdAndUser(Long id, AppUser user);
}

