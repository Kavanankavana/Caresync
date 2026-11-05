package com.caresync;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;

/**
 * CareSync Database Connection Utility (JDBC)
 * Connects to MySQL schema 'caresyncjava' with root user and password 'tiger'.
 */
public class DBConnection {
    private static final String URL = "jdbc:mysql://localhost:3306/caresyncjava?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC";
    private static final String USER = "root";
    private static final String PASSWORD = "tiger";

    static {
        try {
            // Load MySQL JDBC Driver
            Class.forName("com.mysql.cj.jdbc.Driver");
        } catch (ClassNotFoundException e) {
            System.err.println("MySQL JDBC Driver not found. Add mysql-connector-j to classpath: " + e.getMessage());
        }
    }

    public static Connection getConnection() throws SQLException {
        return DriverManager.getConnection(URL, USER, PASSWORD);
    }

    public static void main(String[] args) {
        System.out.println("Testing MySQL Connection to 'caresyncjava'...");
        try (Connection conn = getConnection()) {
            if (conn != null && !conn.isClosed()) {
                System.out.println("✓ Successfully connected to MySQL database 'caresyncjava'!");
            }
        } catch (SQLException e) {
            System.err.println("✗ Connection failed: " + e.getMessage());
        }
    }
}
