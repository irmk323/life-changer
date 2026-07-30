package com.example.leetcodetrainer.referenceanswer.service;

import java.io.InputStream;
import java.util.*;
import org.springframework.core.io.Resource;
import org.springframework.core.io.support.PathMatchingResourcePatternResolver;
import org.springframework.stereotype.Component;
import org.yaml.snakeyaml.Yaml;

@Component
public class ReferenceAnswerResourceLoader {
    public List<ReferenceAnswerDocument> loadAll() {
        try {
            Resource[] resources = new PathMatchingResourcePatternResolver().getResources("classpath*:learning-content/reference-answers/*.yml");
            List<ReferenceAnswerDocument> documents = new ArrayList<>();
            for (Resource resource : resources) try (InputStream stream = resource.getInputStream()) {
                Map<String,Object> root = new Yaml().load(stream);
                List<ReferenceAnswerDocument.Stage> stages = new ArrayList<>();
                for (Object item : list(root.get("stages"))) { Map<String,Object> stage = map(item); stages.add(new ReferenceAnswerDocument.Stage(string(stage,"stage"), string(stage,"stageLabel"), integer(stage,"order"), string(stage,"applicability"), string(stage,"modelAnswer"))); }
                documents.add(new ReferenceAnswerDocument(integer(root,"schemaVersion"), integer(root,"contentVersion"), string(root,"problemSlug"), string(root,"title"), string(root,"pattern"), stages, resource.getFilename()));
            }
            return documents;
        } catch (Exception e) { throw new IllegalStateException("模範回答YAMLを読み込めません: " + e.getMessage(), e); }
    }
    @SuppressWarnings("unchecked") private Map<String,Object> map(Object value) { if (!(value instanceof Map<?,?>)) throw new IllegalArgumentException("YAML object が必要です。"); return (Map<String,Object>) value; }
    @SuppressWarnings("unchecked") private List<Object> list(Object value) { if (!(value instanceof List<?>)) throw new IllegalArgumentException("stages は配列である必要があります。"); return (List<Object>) value; }
    private String string(Map<String,Object> value, String key) { return value.get(key) == null ? null : String.valueOf(value.get(key)); }
    private int integer(Map<String,Object> value, String key) { Object item=value.get(key); if (!(item instanceof Number number)) throw new IllegalArgumentException(key + " は数値である必要があります。"); return number.intValue(); }
}
