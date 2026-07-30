package com.example.leetcodetrainer.referenceanswer.service;

import com.example.leetcodetrainer.attempt.domain.StageType;
import com.example.leetcodetrainer.referenceanswer.domain.StageApplicability;
import java.util.*;
import org.springframework.stereotype.Component;

@Component
public class ReferenceAnswerValidator {
    public void validate(List<ReferenceAnswerDocument> documents) {
        if (documents.size()!=8) fail("教材ファイルは8件必要ですが " + documents.size() + " 件です。");
        Set<String> slugs=new HashSet<>(); int total=0;
        for (ReferenceAnswerDocument document:documents) {
            if (document.contentVersion()<=0) fail(document.sourceFile()+": contentVersion は正の整数である必要があります。");
            if (document.schemaVersion()!=1) fail(document.sourceFile()+": schemaVersion 1 のみ対応しています。");
            if (blank(document.problemSlug()) || !slugs.add(document.problemSlug())) fail(document.sourceFile()+": problemSlug が空または重複しています。");
            if (document.stages().size()!=13) fail(document.sourceFile()+": 13工程必要ですが "+document.stages().size()+" 件です。");
            Set<StageType> stageTypes=EnumSet.noneOf(StageType.class); Set<Integer> orders=new HashSet<>();
            for (ReferenceAnswerDocument.Stage stage:document.stages()) {
                StageType type; try { type=StageType.valueOf(stage.stage()); } catch (Exception e) { fail(document.sourceFile()+": stage="+stage.stage()+" は不正です。"); return; }
                try { StageApplicability.valueOf(stage.applicability()); } catch (Exception e) { fail(document.sourceFile()+": stage="+stage.stage()+" の applicability は不正です。"); }
                if (!stageTypes.add(type)) fail(document.sourceFile()+": stage="+stage.stage()+" が重複しています。");
                if (!orders.add(stage.order()) || stage.order()<1 || stage.order()>13) fail(document.sourceFile()+": stage="+stage.stage()+" の order は1〜13で一意である必要があります。");
                if (blank(stage.modelAnswer())) fail(document.sourceFile()+": stage="+stage.stage()+" の modelAnswer は空にできません。");
                if (type.getOrder()!=stage.order()) fail(document.sourceFile()+": stage="+stage.stage()+" の order が工程定義と一致しません。");
            }
            if (stageTypes.size()!=StageType.values().length) fail(document.sourceFile()+": 13工程がすべて揃っていません。"); total+=document.stages().size();
        }
        if (total!=104) fail("模範回答は104件必要ですが "+total+" 件です。");
    }
    private boolean blank(String value){return value==null||value.isBlank();} private void fail(String message){throw new IllegalArgumentException(message);}
}
