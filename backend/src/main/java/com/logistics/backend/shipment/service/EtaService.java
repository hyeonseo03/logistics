package com.logistics.backend.shipment.service;

import com.logistics.backend.shipment.dto.EtaRequest;
import com.logistics.backend.shipment.dto.EtaResult;

import java.util.Optional;

// 도착 예상 시각 계산기 (인터페이스)
//
// 지금은 RuleBasedEtaService(규칙 기반) 하나만 구현되어 있다.
// 나중에 AI 모델 API 로 바꾸려면 이 인터페이스를 구현한 새 클래스(예: AiModelEtaService)를 만들고
// 그 클래스에 @Primary 를 붙이거나 RuleBasedEtaService 의 @Service 를 떼면 된다.
// 이 인터페이스를 쓰는 쪽(배송 조회, AI 도우미)은 코드를 한 줄도 바꿀 필요가 없다
public interface EtaService {

    // 취소·회수처럼 도착 예정이 의미 없는 상태면 빈 값
    Optional<EtaResult> estimate(EtaRequest request);
}
