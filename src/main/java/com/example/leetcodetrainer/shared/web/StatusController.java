package com.example.leetcodetrainer.shared.web;

import java.time.Instant;
import java.util.Map;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class StatusController {

    @GetMapping(value = "/status", produces = MediaType.APPLICATION_JSON_VALUE)
    public Map<String, Object> status() {
        return Map.of("status", "UP", "application", "leetcode-thinking-trainer", "timestamp", Instant.now().toString());
    }
}
