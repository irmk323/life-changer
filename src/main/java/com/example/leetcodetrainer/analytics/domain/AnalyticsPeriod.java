package com.example.leetcodetrainer.analytics.domain;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneId;

public enum AnalyticsPeriod {
    DAYS_7("過去7日" , 7), DAYS_28("過去28日", 28), DAYS_90("過去90日", 90), ALL("全期間", 0);
    private final String displayName; private final int days;
    AnalyticsPeriod(String displayName, int days) { this.displayName = displayName; this.days = days; }
    public String getDisplayName() { return displayName; }
    public Instant start(Clock clock, ZoneId zoneId) {
        return days == 0 ? null : java.time.LocalDate.now(clock.withZone(zoneId)).minusDays(days - 1L).atStartOfDay(zoneId).toInstant();
    }
}
