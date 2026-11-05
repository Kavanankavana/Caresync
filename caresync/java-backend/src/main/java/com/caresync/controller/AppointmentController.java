package com.caresync.controller;

import com.caresync.model.Appointment;
import com.caresync.repository.AppointmentRepository;
import com.caresync.service.ClinicService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * REST Controller for Appointment booking and status updates.
 */
@RestController
@RequestMapping("/api/appointments")
@CrossOrigin(origins = "*")
public class AppointmentController {

    private final AppointmentRepository appointmentRepo;
    private final ClinicService clinicService;

    public AppointmentController(AppointmentRepository appointmentRepo, ClinicService clinicService) {
        this.appointmentRepo = appointmentRepo;
        this.clinicService = clinicService;
    }

    @GetMapping
    public ResponseEntity<List<Appointment>> getAllAppointments() {
        return ResponseEntity.ok(appointmentRepo.findAllByOrderByDateAscTimeAsc());
    }

    @PostMapping
    public ResponseEntity<Map<String, Object>> addAppointment(@RequestBody Appointment appointment) {
        Appointment saved = clinicService.addAppointment(appointment);
        return ResponseEntity.ok(Map.of(
            "success", true,
            "appointment", saved
        ));
    }

    @PatchMapping("/{id}")
    public ResponseEntity<Map<String, Object>> updateAppointment(@PathVariable Integer id,
                                                                 @RequestBody Map<String, Object> updates) {
        Appointment updated = clinicService.updateAppointment(id, updates);
        return ResponseEntity.ok(Map.of(
            "success", true,
            "id", id,
            "appointment", updated
        ));
    }
}
