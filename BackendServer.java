import com.sun.net.httpserver.HttpServer;
import com.sun.net.httpserver.HttpHandler;
import com.sun.net.httpserver.HttpExchange;

import java.io.IOException;
import java.io.OutputStream;
import java.io.InputStream;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;
import java.util.Date;
import java.util.Map;
import java.util.stream.Collectors;
import java.util.stream.Stream;

public class BackendServer {

    // --- Database Configuration ---
    // IMPORTANT: In a real app, load these from a config file.
    private static final String DB_URL = "jdbc:mysql://localhost:3306/mrs_academy";
    private static final String DB_USER = "your_db_user"; // <-- CHANGE THIS
    private static final String DB_PASSWORD = "your_db_password"; // <-- CHANGE THIS

    // No longer using in-memory lists for users
    // static List<String> users = new ArrayList<>();

    public static void main(String[] args) throws IOException {
        int port = 8080;
        HttpServer server = HttpServer.create(new InetSocketAddress(port), 0);

        // Contexts (Routes)
        server.createContext("/", new StaticHandler());
        server.createContext("/api/register", new RegisterHandler());
        server.createContext("/api/login", new LoginHandler());

        // Test DB connection on startup
        try (Connection conn = DriverManager.getConnection(DB_URL, DB_USER, DB_PASSWORD)) {
            System.out.println("Database connection successful!");
        } catch (SQLException e) {
            System.err.println("Database connection failed! Please check your DB_URL, DB_USER, and DB_PASSWORD.");
        }

        server.setExecutor(null); // creates a default executor
        System.out.println("MRS Java Server running at http://localhost:" + port);
        server.start();
    }

    // Handler for static files (simplified)
    static class StaticHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange t) throws IOException {
            String response = "<h1>MRS Java Backend is Running</h1><p>This is a placeholder for static file serving.</p>";
            t.sendResponseHeaders(200, response.length());
            OutputStream os = t.getResponseBody();
            os.write(response.getBytes());
            os.close();
        }
    }

    // Handler for Registration
    static class RegisterHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange t) throws IOException {
            if ("POST".equals(t.getRequestMethod())) {
                InputStream is = t.getRequestBody();
                String requestBody = new String(is.readAllBytes(), StandardCharsets.UTF_8);
                Map<String, String> params = JsonUtil.parse(requestBody);

                String name = params.get("name");
                String email = params.get("email");
                String password = params.get("password"); // In production, hash this password!
                String role = params.get("role");
                String adminKey = params.get("adminKey");

                if ("Admin".equals(role) && !"MRS_ADMIN_2026".equals(adminKey)) {
                    sendResponse(t, "{\"success\": false, \"message\": \"Invalid Admin Secret Key.\"}", 403);
                    return;
                }

                String sql = "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)";
                String response;
                int statusCode = 200;

                try (Connection conn = DriverManager.getConnection(DB_URL, DB_USER, DB_PASSWORD);
                     PreparedStatement pstmt = conn.prepareStatement(sql)) {

                    pstmt.setString(1, name);
                    pstmt.setString(2, email);
                    pstmt.setString(3, password);
                    pstmt.setString(4, role);
                    pstmt.executeUpdate();

                    System.out.println("[Auth] New user registered: " + email);
                    response = "{\"success\": true, \"message\": \"Registration successful! Please login.\"}";

                } catch (SQLException e) {
                    response = "{\"success\": false, \"message\": \"Registration failed. Email may already be in use.\"}";
                    statusCode = 400; // Bad Request
                    e.printStackTrace();
                }

                sendResponse(t, response, statusCode);

            } else {
                sendResponse(t, "Method Not Allowed", 405);
            }
        }
    }

    // Handler for Login
    static class LoginHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange t) throws IOException {
            if ("POST".equals(t.getRequestMethod())) {
                InputStream is = t.getRequestBody();
                String requestBody = new String(is.readAllBytes(), StandardCharsets.UTF_8);
                Map<String, String> params = JsonUtil.parse(requestBody);

                String email = params.get("email");
                String password = params.get("password");

                String sql = "SELECT name, email, role FROM users WHERE email = ? AND password = ?";
                String response;
                int statusCode = 200;

                try (Connection conn = DriverManager.getConnection(DB_URL, DB_USER, DB_PASSWORD);
                     PreparedStatement pstmt = conn.prepareStatement(sql)) {

                    pstmt.setString(1, email);
                    pstmt.setString(2, password);

                    try (ResultSet rs = pstmt.executeQuery()) {
                        if (rs.next()) {
                            String name = rs.getString("name");
                            String userEmail = rs.getString("email");
                            String role = rs.getString("role");
                            response = String.format("{\"success\": true, \"user\": {\"name\": \"_NAME_\", \"email\": \"_EMAIL_\", \"role\": \"_ROLE_\"}}", name, userEmail, role)
                                    .replace("_NAME_", name)
                                    .replace("_EMAIL_", userEmail)
                                    .replace("_ROLE_", role);
                        } else {
                            response = "{\"success\": false, \"message\": \"Invalid email or password\"}";
                            statusCode = 401; // Unauthorized
                        }
                    }
                } catch (SQLException e) {
                    response = "{\"success\": false, \"message\": \"Database error during login.\"}";
                    statusCode = 500; // Internal Server Error
                    e.printStackTrace();
                }

                sendResponse(t, response, statusCode);

            } else {
                sendResponse(t, "Method Not Allowed", 405);
            }
        }
    }

    // Utility to send a response
    private static void sendResponse(HttpExchange t, String response, int statusCode) throws IOException {
        t.getResponseHeaders().add("Content-Type", "application/json");
        t.sendResponseHeaders(statusCode, response.getBytes(StandardCharsets.UTF_8).length);
        OutputStream os = t.getResponseBody();
        os.write(response.getBytes(StandardCharsets.UTF_8));
        os.close();
    }

    // A very basic utility to parse JSON-like strings.
    // In a real application, use a library like Gson or Jackson.
    static class JsonUtil {
        public static Map<String, String> parse(String body) {
            return Stream.of(body.replace("{", "").replace("}", "").replace("\"", "").split(","))
                    .map(s -> s.split(":", 2)).collect(Collectors.toMap(a -> a[0], a -> a.length > 1 ? a[1] : ""));
        }
    }
}