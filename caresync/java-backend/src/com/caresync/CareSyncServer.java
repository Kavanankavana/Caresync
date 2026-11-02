package com.caresync;

import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;
import com.sun.net.httpserver.HttpServer;

import java.io.IOException;
import java.io.OutputStream;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.sql.*;

/**
 * CareSync Java Backend Server
 * Provides REST API endpoints querying MySQL database 'caresyncjava'
 */
public class CareSyncServer {
    private static final int PORT = 8080;

    public static void main(String[] args) throws IOException {
        HttpServer server = HttpServer.create(new InetSocketAddress(PORT), 0);

        server.createContext("/api/status", new StatusHandler());
        server.createContext("/api/doctors", new DoctorsHandler());
        server.createContext("/api/patients", new PatientsHandler());
        server.createContext("/api/appointments", new AppointmentsHandler());
        server.createContext("/api/queue", new QueueHandler());

        server.setExecutor(null);
        System.out.println("==================================================");
        System.out.println("  CareSync Java Backend Server running on port " + PORT);
        System.out.println("  MySQL Database: caresyncjava (root@localhost)");
        System.out.println("==================================================");
        server.start();
    }

    private static void sendJsonResponse(HttpExchange exchange, int statusCode, String response) throws IOException {
        exchange.getResponseHeaders().set("Content-Type", "application/json");
        exchange.getResponseHeaders().set("Access-Control-Allow-Origin", "*");
        exchange.getResponseHeaders().set("Access-Control-Allow-Methods", "GET, POST, PATCH, OPTIONS");
        exchange.getResponseHeaders().set("Access-Control-Allow-Headers", "Content-Type");

        if ("OPTIONS".equalsIgnoreCase(exchange.getRequestMethod())) {
            exchange.sendResponseHeaders(204, -1);
            return;
        }

        byte[] bytes = response.getBytes(StandardCharsets.UTF_8);
        exchange.sendResponseHeaders(statusCode, bytes.length);
        try (OutputStream os = exchange.getResponseBody()) {
            os.write(bytes);
        }
    }

    static class StatusHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            try (Connection conn = DBConnection.getConnection()) {
                sendJsonResponse(exchange, 200, "{\"status\":\"ok\",\"database\":\"caresyncjava\",\"connected\":true}");
            } catch (SQLException e) {
                sendJsonResponse(exchange, 500, "{\"status\":\"error\",\"error\":\"" + e.getMessage() + "\"}");
            }
        }
    }

    static class DoctorsHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            StringBuilder sb = new StringBuilder("[");
            try (Connection conn = DBConnection.getConnection();
                 Statement stmt = conn.createStatement();
                 ResultSet rs = stmt.executeQuery("SELECT * FROM doctors")) {
                boolean first = true;
                while (rs.next()) {
                    if (!first) sb.append(",");
                    sb.append(String.format("{\"id\":%d,\"name\":\"%s\",\"department\":\"%s\",\"daily_slots\":%d}",
                            rs.getInt("id"),
                            rs.getString("name"),
                            rs.getString("department"),
                            rs.getInt("daily_slots")));
                    first = false;
                }
                sb.append("]");
                sendJsonResponse(exchange, 200, sb.toString());
            } catch (SQLException e) {
                sendJsonResponse(exchange, 500, "{\"error\":\"" + e.getMessage() + "\"}");
            }
        }
    }

    static class PatientsHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            StringBuilder sb = new StringBuilder("[");
            try (Connection conn = DBConnection.getConnection();
                 Statement stmt = conn.createStatement();
                 ResultSet rs = stmt.executeQuery("SELECT * FROM patients")) {
                boolean first = true;
                while (rs.next()) {
                    if (!first) sb.append(",");
                    sb.append(String.format("{\"id\":%d,\"name\":\"%s\",\"age\":%d,\"phone\":\"%s\"}",
                            rs.getInt("id"),
                            rs.getString("name"),
                            rs.getInt("age"),
                            rs.getString("phone")));
                    first = false;
                }
                sb.append("]");
                sendJsonResponse(exchange, 200, sb.toString());
            } catch (SQLException e) {
                sendJsonResponse(exchange, 500, "{\"error\":\"" + e.getMessage() + "\"}");
            }
        }
    }

    static class AppointmentsHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            StringBuilder sb = new StringBuilder("[");
            try (Connection conn = DBConnection.getConnection();
                 Statement stmt = conn.createStatement();
                 ResultSet rs = stmt.executeQuery("SELECT * FROM appointments")) {
                boolean first = true;
                while (rs.next()) {
                    if (!first) sb.append(",");
                    sb.append(String.format("{\"id\":%d,\"patient_id\":%d,\"doctor_id\":%d,\"date\":\"%s\",\"time\":\"%s\",\"reason\":\"%s\"}",
                            rs.getInt("id"),
                            rs.getInt("patient_id"),
                            rs.getInt("doctor_id"),
                            rs.getString("date"),
                            rs.getString("time"),
                            rs.getString("reason") != null ? rs.getString("reason") : ""));
                    first = false;
                }
                sb.append("]");
                sendJsonResponse(exchange, 200, sb.toString());
            } catch (SQLException e) {
                sendJsonResponse(exchange, 500, "{\"error\":\"" + e.getMessage() + "\"}");
            }
        }
    }

    static class QueueHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            StringBuilder sb = new StringBuilder("[");
            try (Connection conn = DBConnection.getConnection();
                 Statement stmt = conn.createStatement();
                 ResultSet rs = stmt.executeQuery("SELECT * FROM queue_tokens")) {
                boolean first = true;
                while (rs.next()) {
                    if (!first) sb.append(",");
                    sb.append(String.format("{\"id\":%d,\"doctor_id\":%d,\"patient_name\":\"%s\",\"token\":\"%s\",\"queue_date\":\"%s\",\"status\":\"%s\"}",
                            rs.getInt("id"),
                            rs.getInt("doctor_id"),
                            rs.getString("patient_name"),
                            rs.getString("token"),
                            rs.getString("queue_date"),
                            rs.getString("status")));
                    first = false;
                }
                sb.append("]");
                sendJsonResponse(exchange, 200, sb.toString());
            } catch (SQLException e) {
                sendJsonResponse(exchange, 500, "{\"error\":\"" + e.getMessage() + "\"}");
            }
        }
    }
}
