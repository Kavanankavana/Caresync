package com.caresync.repository;

import com.caresync.model.QueueToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Spring Data JPA Repository for QueueToken Entity.
 */
@Repository
public interface QueueTokenRepository extends JpaRepository<QueueToken, Integer> {
    List<QueueToken> findAllByOrderByIdAsc();
    Optional<QueueToken> findByToken(String token);
}
