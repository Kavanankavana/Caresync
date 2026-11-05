package com.caresync.controller;

import com.caresync.model.Doctor;
import com.caresync.repository.DoctorRepository;
import com.caresync.service.ClinicService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * REST Controller for Doctor management and capacity updates.
 */
@RestController
@RequestMapping("/api/doctors")
@CrossOrigin(origins = "*")
public class DoctorController {

    private final DoctorRepository doctorRepo;
    private final ClinicService clinicService;

    public DoctorController(DoctorRepository doctorRepo, ClinicService clinicService) {
        this.doctorRepo = doctorRepo;
        this.clinicService = clinicService;
    }

    @GetMapping
    public ResponseEntity<List<Doctor>> getAllDoctors() {
        return ResponseEntity.ok(doctorRepo.findAllByOrderByIdAsc());
    }

    @PatchMapping("/{id}")
    public ResponseEntity<Map<String, Object>> updateDoctor(@PathVariable Integer id,
                                                            @RequestBody Map<String, Object> updates) {
        Doctor updated = clinicService.updateDoctor(id, updates);
        return ResponseEntity.ok(Map.of(
            "success", true,
            "id", id,
            "doctor", updated
        ));
    }
}
