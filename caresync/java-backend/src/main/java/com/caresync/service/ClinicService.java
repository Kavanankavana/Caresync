package com.caresync.service;

import com.caresync.dto.StateResponse;
import com.caresync.model.*;
import com.caresync.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

/**
 * Main Business Service layer for CareSync clinic operations.
 */
@Service
public class ClinicService {

    private final DoctorRepository doctorRepo;
    private final PatientRepository patientRepo;
    private final AppointmentRepository appointmentRepo;
    private final QueueTokenRepository queueTokenRepo;
    private final ClinicSettingRepository settingRepo;

    public ClinicService(DoctorRepository doctorRepo,
                         PatientRepository patientRepo,
                         AppointmentRepository appointmentRepo,
                         QueueTokenRepository queueTokenRepo,
                         ClinicSettingRepository settingRepo) {
        this.doctorRepo = doctorRepo;
        this.patientRepo = patientRepo;
        this.appointmentRepo = appointmentRepo;
        this.queueTokenRepo = queueTokenRepo;
        this.settingRepo = settingRepo;
    }

    @Transactional(readOnly = true)
    public StateResponse getFullState() {
        Map<String, Object> settings = new HashMap<>();
        settings.put("clinic", "CareSync Clinic");
        settings.put("avg", 8);
        settings.put("notify", true);

        for (ClinicSetting s : settingRepo.findAll()) {
            if ("avg".equals(s.getSettingKey())) {
                try {
                    settings.put("avg", Integer.parseInt(s.getSettingValue()));
                } catch (NumberFormatException ignored) {}
            } else if ("notify".equals(s.getSettingKey())) {
                settings.put("notify", Boolean.parseBoolean(s.getSettingValue()));
            } else {
                settings.put(s.getSettingKey(), s.getSettingValue());
            }
        }

        List<Doctor> doctors = doctorRepo.findAllByOrderByIdAsc();
        List<Patient> patients = patientRepo.findAllByOrderByIdAsc();
        List<Appointment> appointments = appointmentRepo.findAllByOrderByDateAscTimeAsc();
        List<QueueToken> queue = queueTokenRepo.findAllByOrderByIdAsc();

        return new StateResponse(settings, doctors, patients, appointments, queue);
    }

    @Transactional
    public Patient addPatient(Patient patient) {
        return patientRepo.save(patient);
    }

    @Transactional
    public Appointment addAppointment(Appointment appt) {
        if (appt.getStatus() == null || appt.getStatus().isBlank()) {
            appt.setStatus("Confirmed");
        }
        return appointmentRepo.save(appt);
    }

    @Transactional
    public Appointment updateAppointment(Integer id, Map<String, Object> updates) {
        Appointment appt = appointmentRepo.findById(id)
            .orElseThrow(() -> new NoSuchElementException("Appointment not found with id: " + id));

        if (updates.containsKey("status")) {
            appt.setStatus(String.valueOf(updates.get("status")));
        }
        if (updates.containsKey("reason")) {
            appt.setReason(String.valueOf(updates.get("reason")));
        }
        if (updates.containsKey("date")) {
            appt.setDate(String.valueOf(updates.get("date")));
        }
        if (updates.containsKey("time")) {
            appt.setTime(String.valueOf(updates.get("time")));
        }
        return appointmentRepo.save(appt);
    }

    @Transactional
    public QueueToken addQueueToken(QueueToken token) {
        if (token.getStatus() == null || token.getStatus().isBlank()) {
            token.setStatus("Waiting");
        }
        return queueTokenRepo.save(token);
    }

    @Transactional
    public QueueToken updateQueueToken(String tokenString, Map<String, Object> updates) {
        QueueToken token = queueTokenRepo.findByToken(tokenString)
            .orElseThrow(() -> new NoSuchElementException("Queue token not found: " + tokenString));

        if (updates.containsKey("status")) {
            token.setStatus(String.valueOf(updates.get("status")));
        }
        return queueTokenRepo.save(token);
    }

    @Transactional
    public Doctor updateDoctor(Integer id, Map<String, Object> updates) {
        Doctor doctor = doctorRepo.findById(id)
            .orElseThrow(() -> new NoSuchElementException("Doctor not found with id: " + id));

        if (updates.containsKey("avail")) {
            doctor.setAvailable(Boolean.parseBoolean(String.valueOf(updates.get("avail"))));
        } else if (updates.containsKey("available")) {
            doctor.setAvailable(Boolean.parseBoolean(String.valueOf(updates.get("available"))));
        }

        if (updates.containsKey("cap")) {
            doctor.setDailySlots(Integer.parseInt(String.valueOf(updates.get("cap"))));
        } else if (updates.containsKey("daily_slots")) {
            doctor.setDailySlots(Integer.parseInt(String.valueOf(updates.get("daily_slots"))));
        }

        return doctorRepo.save(doctor);
    }

    @Transactional
    public void saveSettings(Map<String, Object> settings) {
        settings.forEach((key, val) -> {
            settingRepo.save(new ClinicSetting(key, String.valueOf(val)));
        });
    }
}
