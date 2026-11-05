package com.caresync.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;

/**
 * QueueToken Entity mapped to 'queue_tokens' table in MySQL via Hibernate ORM.
 */
@Entity
@Table(name = "queue_tokens")
public class QueueToken {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "doctor_id", nullable = false)
    @JsonProperty("doctor")
    private Integer doctorId;

    @Column(name = "patient_name", nullable = false, length = 100)
    @JsonProperty("name")
    private String patientName;

    @Column(nullable = false, length = 10)
    private String token;

    @Column(name = "queue_date", nullable = false, length = 20)
    @JsonProperty("date")
    private String queueDate;

    @Column(nullable = false, length = 20)
    private String status = "Waiting";

    public QueueToken() {}

    public QueueToken(Integer id, Integer doctorId, String patientName, String token, String queueDate, String status) {
        this.id = id;
        this.doctorId = doctorId;
        this.patientName = patientName;
        this.token = token;
        this.queueDate = queueDate;
        this.status = status;
    }

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public Integer getDoctorId() {
        return doctorId;
    }

    public void setDoctorId(Integer doctorId) {
        this.doctorId = doctorId;
    }

    public String getPatientName() {
        return patientName;
    }

    public void setPatientName(String patientName) {
        this.patientName = patientName;
    }

    public String getToken() {
        return token;
    }

    public void setToken(String token) {
        this.token = token;
    }

    public String getQueueDate() {
        return queueDate;
    }

    public void setQueueDate(String queueDate) {
        this.queueDate = queueDate;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }
}
