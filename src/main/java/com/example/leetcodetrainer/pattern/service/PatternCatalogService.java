package com.example.leetcodetrainer.pattern.service;

import com.example.leetcodetrainer.pattern.domain.Pattern;
import com.example.leetcodetrainer.pattern.repository.PatternRepository;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class PatternCatalogService {

    private final PatternRepository patternRepository;

    public PatternCatalogService(PatternRepository patternRepository) {
        this.patternRepository = patternRepository;
    }

    public List<Pattern> findAll() {
        return patternRepository.findAll().stream()
                .sorted((left, right) -> left.getName().compareToIgnoreCase(right.getName()))
                .toList();
    }
}
