package com.example.leetcodetrainer.curriculum.domain;
import jakarta.persistence.*; import java.time.*; import java.util.*;
@Entity @Table(name="content_exposure_event") public class ContentExposureEvent { @Id private UUID id; @Column(name="problem_id") private UUID problemId; @Column(name="pattern_id") private UUID patternId; @Column(name="learning_session_id") private UUID learningSessionId; @Enumerated(EnumType.STRING) private ContentExposureType exposureType; private String contentReference; private Instant exposedAt; protected ContentExposureEvent(){} }
