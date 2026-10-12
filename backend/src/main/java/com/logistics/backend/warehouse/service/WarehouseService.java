package com.logistics.backend.warehouse.service;

import com.logistics.backend.warehouse.dto.WarehouseResponse;
import com.logistics.backend.warehouse.repository.WarehouseRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class WarehouseService {

    private final WarehouseRepository warehouseRepository;

    public List<WarehouseResponse> getWarehouses() {
        return warehouseRepository.findAll(Sort.by("id")).stream()
                .map(WarehouseResponse::from)
                .toList();
    }
}
