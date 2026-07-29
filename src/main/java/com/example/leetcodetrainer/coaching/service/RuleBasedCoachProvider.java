package com.example.leetcodetrainer.coaching.service;
import com.example.leetcodetrainer.attempt.domain.*; import com.example.leetcodetrainer.coaching.domain.*; import com.example.leetcodetrainer.failure.dto.*; import org.springframework.stereotype.Component; import java.util.*;
@Component public class RuleBasedCoachProvider implements CoachProvider {
 public String name(){return "RuleBasedCoach";} public String version(){return "2";}
 public CoachingResponse generate(CoachingContext c){
  List<String> independent=c.stages().stream().filter(s->Integer.valueOf(2).equals(s.getScore())).map(s->s.getStageType().getDisplayName()).toList(); BottleneckSuggestion primary=c.analysis().primary();
  String observation=independent.isEmpty()?"今回、自力で完了した工程の記録はまだ十分ではありません。":"今回は「"+String.join("・",independent.stream().limit(3).toList())+"」をヒントなしで完了しました。";
  String bottleneck=primary==null?"確認済みの主要ボトルネックはまだありません。":primary.evidence().stage()==null?"現在の候補は「"+primary.label().getDisplayName()+"」です。":""+primary.evidence().stage().getDisplayName()+"で score "+primary.evidence().score()+"、Hint Level "+primary.evidence().maxHintLevel()+"でした。";
  String interpretation=primary==null?"次の演習では、各工程を具体的に記録して比較できるようにします。":"問題全体の評価ではなく、「"+primary.label().getDisplayName()+"」という現在の工程に限定した記録です。";
  String next=primary!=null&&primary.evidence().stage()==StageType.UPDATED_REGION?"次回はデータ構造名の前に、状態のどこを参照し、何を確定・追加・削除するかを記録してください。":primary!=null?"次回は「"+primary.evidence().stage().getDisplayName()+"」を、答えの前に一文で説明してください。":"次回はまず問題の関係を一文で記録してください。";
  String evidence=primary==null?"score とヒント利用の記録が不足しているため、一般化した結論は出していません。":"根拠: "+primary.label().getCode()+"、score="+primary.evidence().score()+"、hint="+primary.evidence().maxHintLevel()+"、過去の確認済み回数="+primary.evidence().previousOccurrenceCount();
  String emotion=negative(c.attempt().getEmotion())?"その感情を否定するものではありません。今回の記録では、できた工程と停止地点を分けて確認します。":null;
  String safety=safety(c.attempt().getEmotion(),c.attempt().getLearningObstacle())?"安全に関わる内容が含まれる可能性があります。このアプリは緊急支援を提供できません。信頼できる身近な人や地域の緊急・専門支援につながることを検討してください。":null;
  return new CoachingResponse(observation,bottleneck,interpretation,next,evidence,emotion,safety);
 }
 private boolean negative(String e){return e!=null&&Set.of("frustrated","anxious","ashamed","hopeless","tired").contains(e.toLowerCase());} private boolean safety(String... v){return Arrays.stream(v).filter(Objects::nonNull).map(String::toLowerCase).anyMatch(s->s.contains("suicide")||s.contains("kill myself")||s.contains("自殺")||s.contains("死にたい"));}
}
