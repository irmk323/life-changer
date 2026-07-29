package com.example.leetcodetrainer.coaching.domain;
public interface CoachProvider { String name(); String version(); CoachingResponse generate(CoachingContext context); }
