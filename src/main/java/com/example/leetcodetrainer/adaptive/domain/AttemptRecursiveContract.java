package com.example.leetcodetrainer.adaptive.domain;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity @Table(name="attempt_recursive_contract")
public class AttemptRecursiveContract {
 @Id @Column(name="attempt_id") private UUID attemptId; @Lob private String functionContract,baseCase,subproblems,compositionRule; @Column(nullable=false) private Instant createdAt,updatedAt;
 protected AttemptRecursiveContract(){} public AttemptRecursiveContract(UUID attemptId,Instant now){this.attemptId=attemptId;createdAt=now;updatedAt=now;}
 public void save(String functionContract,String baseCase,String subproblems,String compositionRule,Instant now){this.functionContract=functionContract;this.baseCase=baseCase;this.subproblems=subproblems;this.compositionRule=compositionRule;updatedAt=now;}
 public UUID getAttemptId(){return attemptId;} public String getFunctionContract(){return functionContract;} public String getBaseCase(){return baseCase;} public String getSubproblems(){return subproblems;} public String getCompositionRule(){return compositionRule;}
}
