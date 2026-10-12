package com.logistics.backend.product.controller;

import com.logistics.backend.product.dto.ProductResponse;
import com.logistics.backend.product.service.ProductService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/products")
@RequiredArgsConstructor
public class ProductController {

    private final ProductService productService;

    // GET /api/products, GET /api/products?categoryId=1
    @GetMapping
    public List<ProductResponse> getProducts(@RequestParam(required = false) Long categoryId) {
        return productService.getProducts(categoryId);
    }

    // GET /api/products/1
    @GetMapping("/{id}")
    public ProductResponse getProduct(@PathVariable Long id) {
        return productService.getProduct(id);
    }
}
