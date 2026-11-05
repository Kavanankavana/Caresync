package com.caresync.repository;

import com.caresync.model.ClinicSetting;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

/**
 * Spring Data JPA Repository for ClinicSetting Entity.
 */
@Repository
public interface ClinicSettingRepository extends JpaRepository<ClinicSetting, String> {
}
