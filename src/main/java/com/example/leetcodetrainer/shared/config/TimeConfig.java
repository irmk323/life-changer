package com.example.leetcodetrainer.shared.config;

import java.time.Clock;
import java.time.ZoneId;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class TimeConfig {
    @Bean
    Clock clock() {
        return Clock.systemDefaultZone();
    }
    @Bean
    ZoneId reviewZoneId(@Value("${app.review.time-zone:Europe/London}") String value) {
        return ZoneId.of(value);
    }
}
