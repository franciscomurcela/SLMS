package es204.user_service.controller;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * User controller for user-related endpoints
 * All endpoints require JWT authentication
 */
@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:5173"})
public class UserController {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    /**
     * Get current authenticated user information from JWT token
     * 
     * @param authentication Spring Security authentication object
     * @return Map with user claims from JWT
     */
    @GetMapping("/whoami")
    public Map<String, Object> whoami(Authentication authentication) {
        Map<String, Object> response = new HashMap<>();
        
        if (authentication != null && authentication.getPrincipal() instanceof Jwt) {
            Jwt jwt = (Jwt) authentication.getPrincipal();
            
            response.put("sub", jwt.getClaimAsString("sub"));
            response.put("email", jwt.getClaimAsString("email"));
            response.put("preferred_username", jwt.getClaimAsString("preferred_username"));
            response.put("email_verified", jwt.getClaimAsBoolean("email_verified"));
            response.put("name", jwt.getClaimAsString("name"));
            response.put("given_name", jwt.getClaimAsString("given_name"));
            response.put("family_name", jwt.getClaimAsString("family_name"));
            
            response.put("message", "User authenticated successfully");
            response.put("service", "user_service");
        } else {
            response.put("error", "Not authenticated");
        }
        
        return response;
    }
    //health check
    @GetMapping("/health")
    public Map<String, Object> health() {
        try {
            // TODO: Adicionar JdbcTemplate se disponível
            return Map.of("status", "ok");
        } catch (Exception e) {
            return Map.of("status", "error", "details", e.getMessage());
        }
    }
    
    /**
     * Get user profile
     * 
     * @param authentication Spring Security authentication object
     * @return User profile information
     */
    @GetMapping("/profile")
    public Map<String, Object> profile(Authentication authentication) {
        Map<String, Object> response = new HashMap<>();
        
        if (authentication != null && authentication.getPrincipal() instanceof Jwt) {
            Jwt jwt = (Jwt) authentication.getPrincipal();
            
            response.put("keycloak_id", jwt.getClaimAsString("sub"));
            response.put("email", jwt.getClaimAsString("email"));
            response.put("username", jwt.getClaimAsString("preferred_username"));
            response.put("email_verified", jwt.getClaimAsBoolean("email_verified"));
            
            // Note: The user is automatically synced to Supabase by UserSyncFilter
            response.put("note", "User data synchronized with Supabase");
        } else {
            response.put("error", "Not authenticated");
        }
        
        return response;
    }
    
    /**
     * Get database Users.id by keycloak_id
     * This endpoint is used by notification-service to translate keycloak_id to Users.id
     * 
     * @param keycloakId The keycloak_id (UUID)
     * @return Map with database user ID
     */
    @GetMapping("/by-keycloak/{keycloakId}")
    public Map<String, Object> getUserByKeycloakId(@PathVariable String keycloakId) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            String sql = "SELECT id FROM \"Users\" WHERE keycloak_id = ?::uuid";
            UUID userId = jdbcTemplate.queryForObject(sql, UUID.class, keycloakId);
            
            response.put("id", userId);
            response.put("keycloak_id", keycloakId);
        } catch (Exception e) {
            response.put("error", "User not found");
            response.put("message", e.getMessage());
        }
        
        return response;
    }
}
