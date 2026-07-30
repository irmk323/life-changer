package com.example.leetcodetrainer.hint.service;

import com.example.leetcodetrainer.attempt.domain.StageType;
import com.example.leetcodetrainer.hint.domain.Hint;
import com.example.leetcodetrainer.hint.repository.HintRepository;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.time.Clock;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.yaml.snakeyaml.Yaml;

@Service
public class StageHintImportService implements ApplicationRunner {
    private final HintRepository hints; private final Clock clock;
    public StageHintImportService(HintRepository hints, Clock clock) { this.hints = hints; this.clock = clock; }
    @Override public void run(ApplicationArguments args) { importClasspathContent(); }
    @Transactional public void importClasspathContent() {
        try (InputStream stream = new ClassPathResource("learning-content/progressive-hints/core-stage-hints.yml").getInputStream()) {
            Map<String, Object> root = new Yaml().load(stream);
            if (!Integer.valueOf(1).equals(root.get("schemaVersion"))) throw new IllegalArgumentException("共通ヒントYAMLのschemaVersionは1である必要があります。");
            List<Map<String, Object>> stages = (List<Map<String, Object>>) root.get("stages");
            if (stages == null || stages.size() != StageType.values().length) throw new IllegalArgumentException("共通ヒントYAMLには13工程必要です。");
            Instant now = Instant.now(clock);
            for (Map<String, Object> item : stages) {
                StageType stage = StageType.valueOf(String.valueOf(item.get("stage"))); int level = ((Number) item.get("level")).intValue(); String content = String.valueOf(item.get("content"));
                if (content.isBlank()) throw new IllegalArgumentException(stage + " の共通ヒントは空にできません。");
                hints.findByProblemIdIsNullAndPatternIdIsNullAndStageTypeAndHintLevel(stage, level)
                        .ifPresentOrElse(hint -> hint.updateContent(content, now), () -> hints.save(new Hint(UUID.nameUUIDFromBytes(("core-stage-hint:" + stage + ":" + level).getBytes(StandardCharsets.UTF_8)), null, null, stage, level, content, 1, true, now)));
            }
        } catch (Exception exception) { throw new IllegalStateException("共通ヒントYAMLを読み込めません: " + exception.getMessage(), exception); }
    }
}
