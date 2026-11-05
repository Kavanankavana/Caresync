package com.caresync.service;

import com.caresync.model.*;
import com.caresync.repository.*;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;

/**
 * Service to seed initial demo data and handle database reset.
 */
@Service
public class DataSeederService implements CommandLineRunner {

    private final DoctorRepository doctorRepo;
    private final PatientRepository patientRepo;
    private final AppointmentRepository appointmentRepo;
    private final QueueTokenRepository queueTokenRepo;
    private final ClinicSettingRepository settingRepo;

    public DataSeederService(DoctorRepository doctorRepo,
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

    @Override
    public void run(String... args) {
        if (doctorRepo.count() == 0) {
            System.out.println("CareSync: Database is empty. Seeding initial demo data via Hibernate...");
            seedAll();
            System.out.println("CareSync: Initial demo data successfully seeded!");
        }
    }

    @Transactional
    public void resetDatabase() {
        queueTokenRepo.deleteAll();
        appointmentRepo.deleteAll();
        patientRepo.deleteAll();
        doctorRepo.deleteAll();
        settingRepo.deleteAll();
        seedAll();
    }

    @Transactional
    public void seedAll() {
        // 1. Settings
        settingRepo.save(new ClinicSetting("clinic", "CareSync Clinic"));
        settingRepo.save(new ClinicSetting("avg", "8"));
        settingRepo.save(new ClinicSetting("notify", "true"));

        // 2. Doctors
        List<Doctor> doctors = List.of(
            new Doctor(null, "Dr. Ananya Rao", "Cardiology", 12, true),
            new Doctor(null, "Dr. Rohan Iyer", "Dermatology", 10, true),
            new Doctor(null, "Dr. Meera Nair", "Neurology", 8, true),
            new Doctor(null, "Dr. Kabir Shah", "Pediatrics", 14, true),
            new Doctor(null, "Dr. Sana Khan", "General Medicine", 16, false)
        );
        doctorRepo.saveAll(doctors);

        // 3. Patients
        String[] names = {
            "Aarav Mehta", "Diya Kapoor", "Vihaan Reddy", "Isha Menon", "Arjun Patel",
            "Kavya Sharma", "Rahul Verma", "Neha Joshi", "Sameer Khan", "Priya Nair"
        };
        List<Patient> patients = new ArrayList<>();
        for (int i = 0; i < names.length; i++) {
            patients.add(new Patient(null, names[i], 24 + i * 4, "98450 " + (11000 + i * 1371)));
        }
        patientRepo.saveAll(patients);

        // 4. Appointments
        LocalDate now = LocalDate.now();
        String today = now.format(DateTimeFormatter.ISO_LOCAL_DATE);
        String[] times = {
            "09:00", "09:30", "10:00", "10:30", "11:00", "11:30", "12:00", "12:30",
            "14:00", "14:30", "15:00", "15:30", "16:00", "16:30", "17:00", "17:30"
        };
        int[] booked = {9, 7, 6, 11, 5};

        List<Appointment> appts = new ArrayList<>();
        for (int di = 0; di < 5; di++) {
            int docId = di + 1;
            for (int i = 0; i < booked[di]; i++) {
                String status = i < 3 ? "Completed" : "Confirmed";
                if (i == booked[di] - 1 && di % 2 == 0) status = "Cancelled";
                int patientId = ((i + di) % 10) + 1;
                appts.add(new Appointment(null, patientId, docId, today, times[i], "Consultation", status));
            }
        }

        // Past appointments
        int[] pastOffsets = {-5, -3, -1};
        for (int i = 0; i < pastOffsets.length; i++) {
            String pastDate = now.plusDays(pastOffsets[i]).format(DateTimeFormatter.ISO_LOCAL_DATE);
            appts.add(new Appointment(null, i + 2, i + 1, pastDate, "10:00", "Follow-up", "Completed"));
        }

        // Future appointments
        int[] futureOffsets = {1, 2, 3};
        for (int i = 0; i < futureOffsets.length; i++) {
            String futureDate = now.plusDays(futureOffsets[i]).format(DateTimeFormatter.ISO_LOCAL_DATE);
            appts.add(new Appointment(null, i + 5, i + 1, futureDate, "11:30", "Check-up", "Confirmed"));
        }
        appointmentRepo.saveAll(appts);

        // 5. Queue Tokens
        String[] queueOrder = {"Completed", "In Progress", "Waiting", "Waiting", "Waiting"};
        Map<Integer, String> docDepts = Map.of(1, "C", 2, "D", 3, "N", 4, "P");

        List<QueueToken> tokens = new ArrayList<>();
        for (int did = 1; did <= 4; did++) {
            int seq = 101;
            for (int i = 0; i < queueOrder.length; i++) {
                String token = docDepts.get(did) + (seq++);
                String patientName = names[(did * 2 + i) % 10];
                tokens.add(new QueueToken(null, did, patientName, token, today, queueOrder[i]));
            }
        }
        tokens.add(new QueueToken(null, 1, "Neha Joshi", "C106", today, "Skipped"));
        queueTokenRepo.saveAll(tokens);
    }
}
