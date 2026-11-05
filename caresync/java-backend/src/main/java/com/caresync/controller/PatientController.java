package com.caresync.controller;

import com.caresync.model.Patient;
import com.caresync.repository.PatientRepository;
import com.caresync.service.ClinicService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * REST Controller for Patient registration and records.
 */
@RestController
@RequestMapping("/api/patients")
@CrossOrigin(origins = "*")
public class PatientController {

    private final PatientRepository patientRepo;
    private final ClinicService clinicService;

    public PatientController(PatientRepository patientRepo, ClinicService clinicService) {
        this.patientRepo = patientRepo;
        this.clinicService = clinicService;
    }

    @GetMapping
    public ResponseEntity<List<Patient>> getAllPatients() {
        return ResponseEntity.ok(patientRepo.findAllByOrderByIdAsc());
    }

    @PostMapping
    public ResponseEntity<Map<String, Object>> addPatient(@RequestBody Patient patient) {
        Patient saved = clinicService.addPatient(patient);
        return ResponseEntity.ok(Map.of(
            "success", true,
            "patient", saved
        ));
    }
}
