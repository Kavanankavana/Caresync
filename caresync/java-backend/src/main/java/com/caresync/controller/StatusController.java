package com.caresync.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * Health & Backend Status Check Endpoint.
 */
@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
public class StatusController {

    @Value("${spring.datasource.username:root}")
    private String dbUser;

    @GetMapping("/status")
    public ResponseEntity<Map<String, Object>> getStatus() {
        return ResponseEntity.ok(Map.of(
            "status", "ok",
            "connected", true,
            "framework", "Spring Boot 3",
            "orm", "Hibernate (Spring Data JPA)",
            "database", "caresyncjava",
            "user", dbUser
        ));
    }
}
