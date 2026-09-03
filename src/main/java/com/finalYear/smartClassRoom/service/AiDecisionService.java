package com.finalYear.smartClassRoom.service;

import com.finalYear.smartClassRoom.entity.AiDecision;
import com.finalYear.smartClassRoom.repository.AiDecisionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AiDecisionService {

    private final AiDecisionRepository repository;

    public AiDecision save(AiDecision decision){
        return repository.save(decision);
    }

}