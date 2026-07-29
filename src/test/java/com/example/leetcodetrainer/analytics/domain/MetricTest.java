package com.example.leetcodetrainer.analytics.domain;

import static org.assertj.core.api.Assertions.assertThat;
import java.time.*;
import org.junit.jupiter.api.Test;

class MetricTest {
    @Test void keepsNoObservationsAsNaInsteadOfZeroPercent() {
        Metric metric = new Metric(0, 0, 0);
        assertThat(metric.independentDisplay()).isEqualTo("N/A");
        assertThat(metric.assistedDisplay()).isEqualTo("N/A");
    }
    @Test void calculatesIndependentAndAssistedRatesFromTheSameSample() {
        Metric metric = new Metric(2, 3, 4);
        assertThat(metric.independentDisplay()).isEqualTo("50%");
        assertThat(metric.assistedDisplay()).isEqualTo("75%");
        assertThat(metric.sampleSize()).isEqualTo(4);
    }
    @Test void usesTheConfiguredZoneForPeriodBoundary() {
        Clock clock = Clock.fixed(Instant.parse("2026-07-28T00:30:00Z"), ZoneOffset.UTC);
        assertThat(AnalyticsPeriod.DAYS_7.start(clock, ZoneId.of("Europe/London"))).isEqualTo(Instant.parse("2026-07-21T23:00:00Z"));
        assertThat(AnalyticsPeriod.ALL.start(clock, ZoneId.of("Europe/London"))).isNull();
    }
}
