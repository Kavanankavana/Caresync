package com.caresync.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;

/**
 * Doctor Entity mapped to 'doctors' table in MySQL via Hibernate ORM.
 */
@Entity
@Table(name = "doctors")
public class Doctor {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(name = "department", nullable = false, length = 60)
    @JsonProperty("dept")
    private String department;

    @Column(name = "daily_slots", nullable = false)
    @JsonProperty("cap")
    private Integer dailySlots = 10;

    @Column(name = "available", nullable = false)
    @JsonProperty("avail")
    private Boolean available = true;

    public Doctor() {}

    public Doctor(Integer id, String name, String department, Integer dailySlots, Boolean available) {
        this.id = id;
        this.name = name;
        this.department = department;
        this.dailySlots = dailySlots;
        this.available = available;
    }

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getDepartment() {
        return department;
    }

    public void setDepartment(String department) {
        this.department = department;
    }

    public Integer getDailySlots() {
        return dailySlots;
    }

    public void setDailySlots(Integer dailySlots) {
        this.dailySlots = dailySlots;
    }

    public Boolean getAvailable() {
        return available;
    }

    public void setAvailable(Boolean available) {
        this.available = available;
    }
}
