package com.antiadhd.category;

import com.antiadhd.common.exception.ResourceNotFoundException;
import com.antiadhd.category.dto.CategoryRequest;
import com.antiadhd.category.dto.CategoryResponse;
import com.antiadhd.user.AppUser;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CategoryService {
    private final CategoryRepository categoryRepository;

    public CategoryService(CategoryRepository categoryRepository) {
        this.categoryRepository = categoryRepository;
    }

    @Transactional(readOnly = true)
    public List<CategoryResponse> list(AppUser user) {
        return categoryRepository.findByUserOrderByNameAsc(user).stream().map(CategoryResponse::from).toList();
    }

    @Transactional
    public CategoryResponse create(AppUser user, CategoryRequest request) {
        Category category = new Category();
        category.setUser(user);
        apply(category, request);
        return CategoryResponse.from(categoryRepository.save(category));
    }

    @Transactional
    public CategoryResponse update(AppUser user, Long id, CategoryRequest request) {
        Category category = findOwned(user, id);
        apply(category, request);
        return CategoryResponse.from(category);
    }

    @Transactional
    public void delete(AppUser user, Long id) {
        categoryRepository.delete(findOwned(user, id));
    }

    public Category findOwned(AppUser user, Long id) {
        return categoryRepository.findByIdAndUser(id, user)
                .orElseThrow(() -> new ResourceNotFoundException("Category not found."));
    }

    private void apply(Category category, CategoryRequest request) {
        category.setName(request.name().trim());
        category.setColor(request.color());
    }
}
