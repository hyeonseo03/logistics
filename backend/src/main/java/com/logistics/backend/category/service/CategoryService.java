package com.logistics.backend.category.service;

import com.logistics.backend.category.dto.CategoryResponse;
import com.logistics.backend.category.repository.CategoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CategoryService {

    private final CategoryRepository categoryRepository;

    public List<CategoryResponse> getCategories() {
        return categoryRepository.findAll(Sort.by("id")).stream()
                .map(CategoryResponse::from)
                .toList();
    }
}
