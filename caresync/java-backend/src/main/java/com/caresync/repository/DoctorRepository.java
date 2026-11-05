package com.caresync.repository;

import com.caresync.model.Doctor;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Spring Data JPA Repository for Doctor Entity.
 * Provides CRUD operations and custom query methods managed by Hibernate.
 */
@Repository
public interface DoctorRepository extends JpaRepository<Doctor, Integer> {
    List<Doctor> findAllByOrderByIdAsc();
}
