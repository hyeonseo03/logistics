package com.logistics.backend.global.init;

import com.logistics.backend.category.entity.Category;
import com.logistics.backend.category.repository.CategoryRepository;
import com.logistics.backend.inventory.entity.Inventory;
import com.logistics.backend.inventory.repository.InventoryRepository;
import com.logistics.backend.product.entity.Product;
import com.logistics.backend.product.repository.ProductRepository;
import com.logistics.backend.warehouse.entity.Warehouse;
import com.logistics.backend.warehouse.entity.WarehouseRegion;
import com.logistics.backend.warehouse.repository.WarehouseRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

// 서버가 시작될 때 한 번 실행된다. 프론트 mocks/ 의 categories, products, warehouses, inventory 와 같은 데이터를 넣는다
// 테이블마다 비어 있을 때만 넣으므로 서버를 다시 켜도 중복되지 않는다
@Component
@Order(2) // 관리자 계정(AdminInitializer) 다음, 샘플 주문(SampleOrderInitializer) 전에 실행
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final CategoryRepository categoryRepository;
    private final ProductRepository productRepository;
    private final WarehouseRepository warehouseRepository;
    private final InventoryRepository inventoryRepository;

    @Override
    @Transactional
    public void run(String... args) {
        initCategoriesAndProducts();
        initWarehouses();
        initInventories();
    }

    private void initCategoriesAndProducts() {
        if (categoryRepository.count() > 0) {
            return; // 이미 데이터가 있으면 넣지 않는다
        }

        Category food = categoryRepository.save(new Category("식품"));
        Category living = categoryRepository.save(new Category("생활용품"));
        Category electronics = categoryRepository.save(new Category("전자기기"));
        Category fashion = categoryRepository.save(new Category("패션"));

        productRepository.saveAll(List.of(
                new Product(food, "제주 감귤 3kg", "새콤달콤한 제주산 햇감귤입니다.", 19900, null, null, LocalDateTime.of(2026, 8, 5, 9, 0)),
                new Product(food, "유기농 현미 10kg", "국내산 유기농 현미입니다.", 38000, null, null, LocalDateTime.of(2026, 8, 8, 9, 0)),
                new Product(food, "콜드브루 원액 1L", "물이나 우유에 타서 마시는 커피 원액입니다.", 15900, null, null, LocalDateTime.of(2026, 8, 20, 9, 0)),
                new Product(food, "무항생제 달걀 30구", "무항생제 인증을 받은 신선한 달걀입니다.", 12900, null, null, LocalDateTime.of(2026, 9, 10, 9, 0)),
                new Product(living, "3겹 롤화장지 30롤", "부드럽고 도톰한 3겹 화장지입니다.", 21900, null, null, LocalDateTime.of(2026, 8, 2, 9, 0)),
                new Product(living, "대용량 세탁세제 3L", "드럼·일반 세탁기 겸용 액체 세제입니다.", 17500, null, null, LocalDateTime.of(2026, 8, 15, 9, 0)),
                new Product(living, "스테인리스 텀블러 500ml", "보온·보냉이 되는 텀블러입니다.", 24000, "실버", null, LocalDateTime.of(2026, 9, 1, 9, 0)),
                new Product(electronics, "무선 이어폰", "노이즈 캔슬링을 지원하는 블루투스 이어폰입니다.", 89000, "블랙", null, LocalDateTime.of(2026, 8, 25, 9, 0)),
                new Product(electronics, "고속 충전기 65W", "노트북과 휴대폰을 함께 충전할 수 있습니다.", 39000, null, null, LocalDateTime.of(2026, 9, 5, 9, 0)),
                new Product(electronics, "블루투스 키보드", "기기 3대까지 연결되는 무선 키보드입니다.", 54000, "화이트 / 한글 자판", null, LocalDateTime.of(2026, 9, 12, 9, 0)),
                new Product(fashion, "기본 반팔 티셔츠", "매일 입기 좋은 면 100% 티셔츠입니다.", 15000, "화이트 / L", null, LocalDateTime.of(2026, 8, 12, 9, 0)),
                new Product(fashion, "경량 패딩 조끼", "가볍고 따뜻한 간절기용 패딩 조끼입니다.", 49000, "그레이 / FREE", null, LocalDateTime.of(2026, 9, 18, 9, 0))
        ));
    }

    private void initWarehouses() {
        if (warehouseRepository.count() > 0) {
            return;
        }

        warehouseRepository.saveAll(List.of(
                new Warehouse("서울 물류센터", WarehouseRegion.SEOUL, "서울시 송파구 문정로 10", true),
                new Warehouse("경기 물류센터", WarehouseRegion.GYEONGGI, "경기도 이천시 마장면 물류로 20", true),
                new Warehouse("부산 물류센터", WarehouseRegion.BUSAN, "부산시 강서구 신항로 30", false)
        ));
    }

    private void initInventories() {
        if (inventoryRepository.count() > 0) {
            return;
        }

        // id 순서로 정렬하면 products.get(0) 이 mock 의 productId 1 이 된다 (센터도 같은 방식)
        List<Product> products = productRepository.findAll(Sort.by("id"));
        List<Warehouse> warehouses = warehouseRepository.findAll(Sort.by("id"));
        Warehouse seoul = warehouses.get(0);
        Warehouse gyeonggi = warehouses.get(1);
        Warehouse busan = warehouses.get(2);

        // 프론트 mocks/inventory.ts 와 같은 데이터 (현재재고, 예약재고)
        inventoryRepository.saveAll(List.of(
                new Inventory(products.get(0), busan, 120, 5),     // 제주 감귤: 부산에만 있음
                new Inventory(products.get(1), gyeonggi, 50, 3),   // 유기농 현미
                new Inventory(products.get(1), busan, 30, 0),
                new Inventory(products.get(2), seoul, 40, 4),      // 콜드브루
                new Inventory(products.get(3), seoul, 0, 0),       // 달걀: 서울 품절, 경기에만 있음
                new Inventory(products.get(3), gyeonggi, 25, 2),
                new Inventory(products.get(4), gyeonggi, 200, 10), // 롤화장지
                new Inventory(products.get(4), busan, 80, 0),
                new Inventory(products.get(5), gyeonggi, 4, 4),    // 세탁세제: 모두 예약됨 → 품절
                new Inventory(products.get(6), seoul, 15, 2),      // 텀블러
                new Inventory(products.get(6), busan, 10, 0),
                new Inventory(products.get(7), seoul, 8, 2),       // 무선 이어폰: 품절 임박
                new Inventory(products.get(8), seoul, 0, 0),       // 충전기: 품절
                new Inventory(products.get(9), gyeonggi, 12, 9),   // 키보드: 품절 임박
                new Inventory(products.get(10), busan, 70, 0),     // 반팔 티셔츠: 부산에만 있음
                new Inventory(products.get(11), seoul, 5, 5),      // 패딩 조끼: 품절 임박
                new Inventory(products.get(11), gyeonggi, 9, 1)
        ));
    }
}
