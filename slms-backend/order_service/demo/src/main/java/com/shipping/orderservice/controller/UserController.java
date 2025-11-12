package com.shipping.orderservice.controller;

import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpStatus;

import jakarta.servlet.http.HttpServletRequest;
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
     * @param request HTTP request for debugging
     * @return Map with user claims from JWT
     */
    @GetMapping("/whoami")
    public ResponseEntity<Map<String, Object>> whoami(Authentication authentication, HttpServletRequest request) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            // Debug info
            response.put("service", "order_service");
            response.put("timestamp", System.currentTimeMillis());
            response.put("authentication_present", authentication != null);
            
            if (authentication != null) {
                response.put("authentication_type", authentication.getClass().getSimpleName());
                response.put("is_authenticated", authentication.isAuthenticated());
                
                if (authentication.getPrincipal() instanceof Jwt) {
                    Jwt jwt = (Jwt) authentication.getPrincipal();
                    
                    response.put("sub", jwt.getClaimAsString("sub"));
                    response.put("email", jwt.getClaimAsString("email"));
                    response.put("preferred_username", jwt.getClaimAsString("preferred_username"));
                    response.put("email_verified", jwt.getClaimAsBoolean("email_verified"));
                    response.put("name", jwt.getClaimAsString("name"));
                    response.put("given_name", jwt.getClaimAsString("given_name"));
                    response.put("family_name", jwt.getClaimAsString("family_name"));
                    
                    response.put("message", "User authenticated successfully");
                    response.put("status", "success");
                } else {
                    response.put("principal_type", authentication.getPrincipal().getClass().getSimpleName());
                    response.put("principal_value", authentication.getPrincipal().toString());
                    response.put("message", "Authentication present but not JWT");
                    response.put("status", "partial");
                }
            } else {
                response.put("message", "No authentication found");
                response.put("status", "error");
                
                // Add debug headers
                Map<String, String> headers = new HashMap<>();
                var headerNames = request.getHeaderNames();
                while (headerNames.hasMoreElements()) {
                    String headerName = headerNames.nextElement();
                    headers.put(headerName, request.getHeader(headerName));
                }
                response.put("request_headers", headers);
            }
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            response.put("error", "Internal error: " + e.getMessage());
            response.put("status", "error");
            response.put("service", "order_service");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }
    
    /**
     * Get user profile information
     * 
     * @param authentication Spring Security authentication object
     * @return Map with extended user profile data
     */
    @GetMapping("/profile")
    public ResponseEntity<Map<String, Object>> getUserProfile(Authentication authentication) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            if (authentication != null && authentication.getPrincipal() instanceof Jwt) {
                Jwt jwt = (Jwt) authentication.getPrincipal();
                
                response.put("id", jwt.getClaimAsString("sub"));
                response.put("username", jwt.getClaimAsString("preferred_username"));
                response.put("email", jwt.getClaimAsString("email"));
                response.put("firstName", jwt.getClaimAsString("given_name"));
                response.put("lastName", jwt.getClaimAsString("family_name"));
                response.put("roles", jwt.getClaimAsStringList("realm_access"));
                
                response.put("authenticated", true);
                response.put("service", "order_service");
            } else {
                response.put("authenticated", false);
                response.put("message", "No valid JWT authentication");
                response.put("service", "order_service");
            }
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            response.put("error", "Error getting profile: " + e.getMessage());
            response.put("authenticated", false);
            response.put("service", "order_service");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }
    
    /**
     * Health check endpoint for debugging
     */
    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> health() {
        Map<String, Object> response = new HashMap<>();
        response.put("status", "UP");
        response.put("service", "order_service");
        response.put("endpoint", "/user/health");
        response.put("timestamp", System.currentTimeMillis());
        return ResponseEntity.ok(response);
    }
}