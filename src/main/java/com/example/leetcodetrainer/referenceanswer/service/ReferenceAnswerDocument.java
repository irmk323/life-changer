package com.example.leetcodetrainer.referenceanswer.service;

import java.util.List;

public record ReferenceAnswerDocument(int schemaVersion, int contentVersion, String problemSlug, String title, String pattern, List<Stage> stages, String sourceFile) {
    public record Stage(String stage, String stageLabel, int order, String applicability, String modelAnswer) { }
}
