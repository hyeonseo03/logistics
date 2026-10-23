package com.logistics.backend.category.controller;

import com.logistics.backend.category.dto.CategoryResponse;
import com.logistics.backend.category.service.CategoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/categories")
@RequiredArgsConstructor
public class CategoryController {

    private final CategoryService categoryService;

    // GET /api/categories
    @GetMapping
    public List<CategoryResponse> getCategories() {
        return categoryService.getCategories();
    }
}
