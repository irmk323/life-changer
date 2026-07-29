package com.example.leetcodetrainer.review.domain;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.LinkedHashMap;
import java.util.Map;

public final class ReviewSchedulePolicy {
    private ReviewSchedulePolicy() { }
    public static Map<ReviewType, LocalDate> initialDates(Instant completedAt, ZoneId zoneId) {
        LocalDate completionDate = completedAt.atZone(zoneId).toLocalDate();
        Map<ReviewType, LocalDate> dates = new LinkedHashMap<>();
        for (ReviewType type : ReviewType.values()) dates.put(type, completionDate.plusDays(type.getOffsetDays()));
        return dates;
    }
    public static ReviewStatus effectiveStatus(ReviewStatus stored, LocalDate scheduledDate, LocalDate today) {
        if (stored == ReviewStatus.COMPLETED || stored == ReviewStatus.CANCELLED) return stored;
        if (scheduledDate.isBefore(today)) return ReviewStatus.MISSED;
        if (scheduledDate.isEqual(today)) return ReviewStatus.DUE;
        return stored == ReviewStatus.RESCHEDULED ? ReviewStatus.RESCHEDULED : ReviewStatus.PENDING;
    }
}
