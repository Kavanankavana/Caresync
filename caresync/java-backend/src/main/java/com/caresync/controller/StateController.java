package com.caresync.controller;

import com.caresync.dto.StateResponse;
import com.caresync.service.ClinicService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * Controller providing full clinic state for frontend synchronization.
 */
@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
public class StateController {

    private final ClinicService clinicService;

    public StateController(ClinicService clinicService) {
        this.clinicService = clinicService;
    }

    @GetMapping("/state")
    public ResponseEntity<Map<String, Object>> getState() {
        StateResponse state = clinicService.getFullState();
        return ResponseEntity.ok(Map.of(
            "success", true,
            "state", state
        ));
    }
}
