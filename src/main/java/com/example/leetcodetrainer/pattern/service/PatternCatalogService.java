package com.example.leetcodetrainer.pattern.service;

import com.example.leetcodetrainer.pattern.domain.Pattern;
import com.example.leetcodetrainer.pattern.domain.ProblemPattern;
import com.example.leetcodetrainer.pattern.domain.ProblemPatternId;
import com.example.leetcodetrainer.pattern.repository.ProblemPatternRepository;
import com.example.leetcodetrainer.pattern.repository.PatternRepository;
import com.example.leetcodetrainer.problem.domain.Problem;
import com.example.leetcodetrainer.problem.repository.ProblemRepository;
import com.example.leetcodetrainer.shared.domain.ResourceNotFoundException;
import java.time.Clock;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PatternCatalogService {

    private final PatternRepository patternRepository;
    private final ProblemRepository problemRepository;
    private final ProblemPatternRepository problemPatternRepository;
    private final Clock clock;

    public PatternCatalogService(PatternRepository patternRepository, ProblemRepository problemRepository,
                                 ProblemPatternRepository problemPatternRepository, Clock clock) {
        this.patternRepository = patternRepository;
        this.problemRepository = problemRepository;
        this.problemPatternRepository = problemPatternRepository;
        this.clock = clock;
    }

    @Transactional(readOnly = true)
    public List<Pattern> findAll() {
        return patternRepository.findAll().stream()
                .sorted((left, right) -> left.getName().compareToIgnoreCase(right.getName()))
                .toList();
    }

    @Transactional(readOnly = true)
    public Pattern getPattern(UUID id) {
        return patternRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Pattern not found: " + id));
    }

    @Transactional(readOnly = true)
    public List<ProblemPattern> findPatternsForProblem(UUID problemId) {
        return problemPatternRepository.findByProblemIdOrderByPrimaryPatternDesc(problemId);
    }

    @Transactional(readOnly = true)
    public List<ProblemPattern> findProblemsForPattern(UUID patternId) {
        return problemPatternRepository.findByPatternIdOrderByProblemLeetcodeNumberAsc(patternId);
    }

    @Transactional(readOnly = true)
    public Map<UUID, String> findPrimaryPatternNames(List<UUID> problemIds) {
        if (problemIds.isEmpty()) {
            return Map.of();
        }
        return problemPatternRepository.findPrimaryPatternNames(problemIds).stream()
                .collect(Collectors.toMap(row -> (UUID) row[0], row -> (String) row[1]));
    }

    @Transactional(readOnly = true)
    public Map<UUID, Long> countRelatedProblems(List<UUID> patternIds) {
        if (patternIds.isEmpty()) {
            return Map.of();
        }
        return problemPatternRepository.countByPatternIds(patternIds).stream()
                .collect(Collectors.toMap(row -> (UUID) row[0], row -> (Long) row[1]));
    }

    @Transactional
    public ProblemPattern associate(UUID problemId, UUID patternId, boolean primaryPattern, String notes) {
        Problem problem = problemRepository.findById(problemId)
                .orElseThrow(() -> new ResourceNotFoundException("Problem not found: " + problemId));
        Pattern pattern = getPattern(patternId);
        if (problemPatternRepository.existsByProblemIdAndPatternId(problemId, patternId)) {
            throw new IllegalArgumentException("Problem is already associated with this pattern");
        }
        if (primaryPattern) {
            clearPrimaryPattern(problemId);
        }
        return problemPatternRepository.save(new ProblemPattern(problem, pattern, primaryPattern, notes, Instant.now(clock)));
    }

    @Transactional
    public void setPrimaryPattern(UUID problemId, UUID patternId) {
        ProblemPattern association = problemPatternRepository.findById(new ProblemPatternId(problemId, patternId))
                .orElseThrow(() -> new ResourceNotFoundException("Problem-pattern association not found"));
        clearPrimaryPattern(problemId);
        association.setPrimaryPattern(true);
    }

    private void clearPrimaryPattern(UUID problemId) {
        problemPatternRepository.findByProblemIdOrderByPrimaryPatternDesc(problemId).stream()
                .filter(ProblemPattern::isPrimaryPattern)
                .forEach(association -> association.setPrimaryPattern(false));
    }
}
