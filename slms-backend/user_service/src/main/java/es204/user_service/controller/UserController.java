package es204.user_service.controller;

import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

/**
 * User controller for user-related endpoints
 * All endpoints require JWT authentication
 */
@RestController
@RequestMapping("/user")
@CrossOrigin(origins = "http://localhost:5173")
public class UserController {

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
}
