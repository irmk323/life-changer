package com.example.leetcodetrainer.curriculum.domain;
import jakarta.persistence.*; import java.time.*; import java.util.*;
@Entity @Table(name="problem_exposure") public class ProblemExposure { @Id private UUID id; @Column(name="problem_id",nullable=false,unique=true) private UUID problemId; @Enumerated(EnumType.STRING) @Column(nullable=false) private ProblemExposureState state; private Instant firstExposedAt,lastExposedAt,createdAt,updatedAt; protected ProblemExposure(){} public UUID getProblemId(){return problemId;} public ProblemExposureState getState(){return state;} }
