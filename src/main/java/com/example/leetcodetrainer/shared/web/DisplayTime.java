package com.example.leetcodetrainer.shared.web;

import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import org.springframework.stereotype.Component;

@Component("displayTime")
public class DisplayTime {
    private static final DateTimeFormatter FORMAT = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");
    private final ZoneId zoneId;

    public DisplayTime(ZoneId reviewZoneId) {
        this.zoneId = reviewZoneId;
    }

    public String format(Instant instant) {
        return instant == null ? "" : FORMAT.format(instant.atZone(zoneId));
    }
}
