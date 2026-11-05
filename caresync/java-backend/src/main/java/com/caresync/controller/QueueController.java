package com.caresync.controller;

import com.caresync.model.QueueToken;
import com.caresync.repository.QueueTokenRepository;
import com.caresync.service.ClinicService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * REST Controller for Live Queue and Token management.
 */
@RestController
@RequestMapping("/api/queue")
@CrossOrigin(origins = "*")
public class QueueController {

    private final QueueTokenRepository queueTokenRepo;
    private final ClinicService clinicService;

    public QueueController(QueueTokenRepository queueTokenRepo, ClinicService clinicService) {
        this.queueTokenRepo = queueTokenRepo;
        this.clinicService = clinicService;
    }

    @GetMapping
    public ResponseEntity<List<QueueToken>> getAllTokens() {
        return ResponseEntity.ok(queueTokenRepo.findAllByOrderByIdAsc());
    }

    @PostMapping
    public ResponseEntity<Map<String, Object>> addToken(@RequestBody QueueToken token) {
        QueueToken saved = clinicService.addQueueToken(token);
        return ResponseEntity.ok(Map.of(
            "success", true,
            "queueToken", saved
        ));
    }

    @PatchMapping("/{token}")
    public ResponseEntity<Map<String, Object>> updateToken(@PathVariable String token,
                                                           @RequestBody Map<String, Object> updates) {
        QueueToken updated = clinicService.updateQueueToken(token, updates);
        return ResponseEntity.ok(Map.of(
            "success", true,
            "token", token,
            "queueToken", updated
        ));
    }
}
