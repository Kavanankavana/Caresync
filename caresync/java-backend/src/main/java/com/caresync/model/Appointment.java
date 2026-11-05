package com.caresync.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;

/**
 * Appointment Entity mapped to 'appointments' table in MySQL via Hibernate ORM.
 */
@Entity
@Table(name = "appointments")
public class Appointment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "patient_id", nullable = false)
    @JsonProperty("patient")
    private Integer patientId;

    @Column(name = "doctor_id", nullable = false)
    @JsonProperty("doctor")
    private Integer doctorId;

    @Column(nullable = false, length = 20)
    private String date;

    @Column(nullable = false, length = 15)
    private String time;

    @Column(length = 255)
    private String reason;

    @Column(nullable = false, length = 20)
    private String status = "Confirmed";

    public Appointment() {}

    public Appointment(Integer id, Integer patientId, Integer doctorId, String date, String time, String reason, String status) {
        this.id = id;
        this.patientId = patientId;
        this.doctorId = doctorId;
        this.date = date;
        this.time = time;
        this.reason = reason;
        this.status = status;
    }

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public Integer getPatientId() {
        return patientId;
    }

    public void setPatientId(Integer patientId) {
        this.patientId = patientId;
    }

    public Integer getDoctorId() {
        return doctorId;
    }

    public void setDoctorId(Integer doctorId) {
        this.doctorId = doctorId;
    }

    public String getDate() {
        return date;
    }

    public void setDate(String date) {
        this.date = date;
    }

    public String getTime() {
        return time;
    }

    public void setTime(String time) {
        this.time = time;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }
}
