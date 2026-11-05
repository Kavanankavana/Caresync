package com.caresync.repository;

import com.caresync.model.Patient;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Spring Data JPA Repository for Patient Entity.
 */
@Repository
public interface PatientRepository extends JpaRepository<Patient, Integer> {
    List<Patient> findAllByOrderByIdAsc();
}
