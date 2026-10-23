package com.logistics.backend.product.service;

import com.logistics.backend.global.exception.BusinessException;
import com.logistics.backend.global.exception.ErrorCode;
import com.logistics.backend.inventory.repository.InventoryRepository;
import com.logistics.backend.product.dto.ProductResponse;
import com.logistics.backend.product.entity.Product;
import com.logistics.backend.product.repository.ProductRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;

// 관리자 상품 이미지 업로드
// 1. 검사: 비어 있지 않은지, 5MB 이하인지, 확장자가 jpg/jpeg/png/webp 인지,
//          파일 앞부분(매직 넘버)이 진짜 jpg/png/webp 인지 (확장자만 바꾼 다른 파일을 막는다)
// 2. 저장: backend/uploads/products/{상품id}-{무작위}.{확장자}  (사용자가 보낸 파일 이름은 쓰지 않는다)
// 3. products.image_url = "/uploads/products/..." 로 바꾸고, 예전에 올린 사진 파일은 지운다
@Slf4j
@Service
public class ProductImageService {

    static final long MAX_SIZE = 5L * 1024 * 1024; // 5MB
    private static final String URL_PREFIX = "/uploads/products/";
    private static final Set<String> ALLOWED_EXTENSIONS = Set.of("jpg", "jpeg", "png", "webp");

    private final ProductRepository productRepository;
    private final InventoryRepository inventoryRepository;
    private final Path productImageDir; // 이미지를 저장할 폴더 (절대 경로)

    public ProductImageService(ProductRepository productRepository,
                               InventoryRepository inventoryRepository,
                               @Value("${app.upload.dir}") String uploadDir) {
        this.productRepository = productRepository;
        this.inventoryRepository = inventoryRepository;
        this.productImageDir = Path.of(uploadDir, "products").toAbsolutePath().normalize();
    }

    @Transactional
    public ProductResponse upload(Long productId, MultipartFile file) {
        Product product = productRepository.findByIdWithCategory(productId)
                .orElseThrow(() -> new BusinessException(ErrorCode.PRODUCT_NOT_FOUND));

        String extension = validate(file);
        String fileName = productId + "-" + UUID.randomUUID() + "." + extension;

        try {
            Files.createDirectories(productImageDir);
            try (InputStream in = file.getInputStream()) {
                Files.copy(in, productImageDir.resolve(fileName));
            }
        } catch (IOException e) {
            log.error("상품 이미지 저장 실패: productId={}", productId, e);
            throw new BusinessException(ErrorCode.IMAGE_UPLOAD_FAILED);
        }

        String oldImageUrl = product.getImageUrl();
        product.changeImage(URL_PREFIX + fileName);
        deleteOldImage(oldImageUrl);

        return ProductResponse.from(product, inventoryRepository.sumTotalStockByProductId(productId));
    }

    // 검사를 통과하면 저장할 확장자를 돌려준다 (jpeg 는 jpg 로 통일)
    private String validate(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BusinessException(ErrorCode.INVALID_IMAGE, "업로드할 이미지 파일을 선택해 주세요.");
        }
        if (file.getSize() > MAX_SIZE) {
            throw new BusinessException(ErrorCode.IMAGE_TOO_LARGE);
        }

        String extension = extensionOf(file.getOriginalFilename());
        if (!ALLOWED_EXTENSIONS.contains(extension)) {
            throw new BusinessException(ErrorCode.INVALID_IMAGE);
        }

        String detected = detectImageType(file);
        if (detected == null) {
            throw new BusinessException(ErrorCode.INVALID_IMAGE, "이미지 파일이 아니거나 손상된 파일입니다. (jpg, png, webp 만 가능)");
        }
        return detected;
    }

    // 파일 앞부분의 정해진 바이트(매직 넘버)로 진짜 형식을 확인한다
    //  jpg : FF D8 FF
    //  png : 89 50 4E 47 0D 0A 1A 0A
    //  webp: "RIFF" ???? "WEBP"
    private String detectImageType(MultipartFile file) {
        byte[] head = new byte[12];
        int read;
        try (InputStream in = file.getInputStream()) {
            read = in.readNBytes(head, 0, head.length);
        } catch (IOException e) {
            return null;
        }

        if (read >= 3 && (head[0] & 0xFF) == 0xFF && (head[1] & 0xFF) == 0xD8 && (head[2] & 0xFF) == 0xFF) {
            return "jpg";
        }
        if (read >= 8 && (head[0] & 0xFF) == 0x89 && head[1] == 'P' && head[2] == 'N' && head[3] == 'G'
                && head[4] == 0x0D && head[5] == 0x0A && head[6] == 0x1A && head[7] == 0x0A) {
            return "png";
        }
        if (read >= 12 && head[0] == 'R' && head[1] == 'I' && head[2] == 'F' && head[3] == 'F'
                && head[8] == 'W' && head[9] == 'E' && head[10] == 'B' && head[11] == 'P') {
            return "webp";
        }
        return null;
    }

    private String extensionOf(String fileName) {
        if (fileName == null || !fileName.contains(".")) {
            return "";
        }
        return fileName.substring(fileName.lastIndexOf('.') + 1).toLowerCase(Locale.ROOT);
    }

    // 예전에 우리가 올린 사진이면 파일을 지운다 (외부 주소이거나 없으면 아무것도 안 함)
    private void deleteOldImage(String oldImageUrl) {
        if (oldImageUrl == null || !oldImageUrl.startsWith(URL_PREFIX)) {
            return;
        }
        // 파일 이름만 꺼내서, "../" 같은 값으로 다른 폴더의 파일을 지우지 못하게 한다
        Path oldFile = productImageDir.resolve(Path.of(oldImageUrl.substring(URL_PREFIX.length())).getFileName());
        try {
            Files.deleteIfExists(oldFile);
        } catch (IOException e) {
            log.warn("예전 상품 이미지를 지우지 못했습니다: {}", oldFile, e); // 지우지 못해도 업로드는 성공으로 둔다
        }
    }
}
