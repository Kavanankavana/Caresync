package com.caresync.dto;

import com.caresync.model.Appointment;
import com.caresync.model.Doctor;
import com.caresync.model.Patient;
import com.caresync.model.QueueToken;

import java.util.List;
import java.util.Map;

/**
 * StateResponse DTO containing full clinic state matching frontend schema.
 */
public class StateResponse {

    private Map<String, Object> settings;
    private List<Doctor> doctors;
    private List<Patient> patients;
    private List<Appointment> appointments;
    private List<QueueToken> queue;

    public StateResponse() {}

    public StateResponse(Map<String, Object> settings, List<Doctor> doctors, List<Patient> patients, List<Appointment> appointments, List<QueueToken> queue) {
        this.settings = settings;
        this.doctors = doctors;
        this.patients = patients;
        this.appointments = appointments;
        this.queue = queue;
    }

    public Map<String, Object> getSettings() {
        return settings;
    }

    public void setSettings(Map<String, Object> settings) {
        this.settings = settings;
    }

    public List<Doctor> getDoctors() {
        return doctors;
    }

    public void setDoctors(List<Doctor> doctors) {
        this.doctors = doctors;
    }

    public List<Patient> getPatients() {
        return patients;
    }

    public void setPatients(List<Patient> patients) {
        this.patients = patients;
    }

    public List<Appointment> getAppointments() {
        return appointments;
    }

    public void setAppointments(List<Appointment> appointments) {
        this.appointments = appointments;
    }

    public List<QueueToken> getQueue() {
        return queue;
    }

    public void setQueue(List<QueueToken> queue) {
        this.queue = queue;
    }
}
