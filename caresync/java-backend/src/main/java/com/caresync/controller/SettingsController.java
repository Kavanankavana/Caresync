package com.caresync.controller;

import com.caresync.dto.StateResponse;
import com.caresync.service.ClinicService;
import com.caresync.service.DataSeederService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * REST Controller for Clinic Settings and database reset operations.
 */
@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
public class SettingsController {

    private final ClinicService clinicService;
    private final DataSeederService dataSeederService;

    public SettingsController(ClinicService clinicService, DataSeederService dataSeederService) {
        this.clinicService = clinicService;
        this.dataSeederService = dataSeederService;
    }

    @PostMapping("/settings")
    public ResponseEntity<Map<String, Object>> saveSettings(@RequestBody Map<String, Object> settings) {
        clinicService.saveSettings(settings);
        return ResponseEntity.ok(Map.of(
            "success", true,
            "settings", settings
        ));
    }

    @PostMapping("/reset")
    public ResponseEntity<Map<String, Object>> resetDatabase() {
        dataSeederService.resetDatabase();
        StateResponse state = clinicService.getFullState();
        return ResponseEntity.ok(Map.of(
            "success", true,
            "message", "Database successfully reset to demo state via Hibernate",
            "state", state
        ));
    }
}
