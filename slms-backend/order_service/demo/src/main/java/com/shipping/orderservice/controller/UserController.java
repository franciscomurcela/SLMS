package com.shipping.orderservice.controller;

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
@CrossOrigin(origins = "*")
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
            response.put("service", "order_service");
        } else {
            response.put("error", "Not authenticated");
            response.put("authentication_type", authentication != null ? authentication.getClass().getSimpleName() : "null");
        }
        
        return response;
    }
    
    /**
     * Get user profile information
     * 
     * @param authentication Spring Security authentication object
     * @return Map with extended user profile data
     */
    @GetMapping("/profile")
    public Map<String, Object> getUserProfile(Authentication authentication) {
        Map<String, Object> response = new HashMap<>();
        
        if (authentication != null && authentication.getPrincipal() instanceof Jwt) {
            Jwt jwt = (Jwt) authentication.getPrincipal();
            
            response.put("id", jwt.getClaimAsString("sub"));
            response.put("username", jwt.getClaimAsString("preferred_username"));
            response.put("email", jwt.getClaimAsString("email"));
            response.put("firstName", jwt.getClaimAsString("given_name"));
            response.put("lastName", jwt.getClaimAsString("family_name"));
            response.put("roles", jwt.getClaimAsStringList("realm_access"));
            
            response.put("authenticated", true);
        } else {
            response.put("authenticated", false);
        }
        
        return response;
    }
}