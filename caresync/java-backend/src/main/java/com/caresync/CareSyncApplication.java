package com.caresync;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * CareSync Spring Boot Application Entry Point.
 * Integrates Spring Boot 3, Hibernate ORM, and Spring Data JPA.
 */
@SpringBootApplication
public class CareSyncApplication {

    public static void main(String[] args) {
        System.out.println("==================================================");
        System.out.println("  Starting CareSync Spring Boot & Hibernate Server");
        System.out.println("==================================================");
        SpringApplication.run(CareSyncApplication.class, args);
    }
}
