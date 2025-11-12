package com.example.demo.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import jakarta.servlet.http.HttpServletRequest;

import java.util.*;

@RestController
@RequestMapping("/user")
@CrossOrigin(origins = "*", allowedHeaders = "*")
public class UserController {
    
    private static final Logger logger = LoggerFactory.getLogger(UserController.class);

    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> health() {
        logger.info("=== USER HEALTH CHECK ===");
        Map<String, Object> health = new HashMap<>();
        health.put("status", "UP");
        health.put("service", "order-service");
        health.put("timestamp", new Date().toString());
        health.put("controller", "UserController");
        return ResponseEntity.ok(health);
    }

    @GetMapping("/whoami")
    public ResponseEntity<Map<String, Object>> whoami(HttpServletRequest request) {
        logger.info("=== WHOAMI REQUEST RECEIVED ===");
        logger.info("Request URI: {}", request.getRequestURI());
        logger.info("Request URL: {}", request.getRequestURL());
        logger.info("Method: {}", request.getMethod());
        
        // Log headers para debugging
        Enumeration<String> headerNames = request.getHeaderNames();
        while (headerNames.hasMoreElements()) {
            String headerName = headerNames.nextElement();
            logger.info("Header {}: {}", headerName, request.getHeader(headerName));
        }

        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            logger.info("Authentication object: {}", authentication);
            logger.info("Authentication type: {}", authentication != null ? authentication.getClass().getName() : "null");
            logger.info("Is authenticated: {}", authentication != null ? authentication.isAuthenticated() : false);
            logger.info("Principal: {}", authentication != null ? authentication.getPrincipal() : "null");

            if (authentication == null) {
                logger.error("No authentication found in security context");
                Map<String, Object> error = new HashMap<>();
                error.put("error", "No authentication");
                error.put("message", "Authentication not found in security context");
                error.put("authenticated", false);
                return ResponseEntity.status(401).body(error);
            }

            if (!authentication.isAuthenticated()) {
                logger.error("User is not authenticated");
                Map<String, Object> error = new HashMap<>();
                error.put("error", "Not authenticated");
                error.put("message", "User is not authenticated");
                error.put("authenticated", false);
                return ResponseEntity.status(401).body(error);
            }

            Map<String, Object> userInfo = new HashMap<>();

            if (authentication instanceof JwtAuthenticationToken jwtAuth) {
                Jwt jwt = jwtAuth.getToken();
                logger.info("JWT Token found. Claims: {}", jwt.getClaims());
                
                userInfo.put("sub", jwt.getClaimAsString("sub"));
                userInfo.put("email", jwt.getClaimAsString("email"));
                userInfo.put("preferred_username", jwt.getClaimAsString("preferred_username"));
                userInfo.put("name", jwt.getClaimAsString("name"));
                userInfo.put("given_name", jwt.getClaimAsString("given_name"));
                userInfo.put("family_name", jwt.getClaimAsString("family_name"));
                
                // Realm roles
                Map<String, Object> realmAccess = jwt.getClaim("realm_access");
                if (realmAccess != null && realmAccess.containsKey("roles")) {
                    userInfo.put("roles", realmAccess.get("roles"));
                }
                
                // Resource roles
                Map<String, Object> resourceAccess = jwt.getClaim("resource_access");
                userInfo.put("resource_access", resourceAccess);
                
                userInfo.put("authenticated", true);
                userInfo.put("exp", jwt.getClaimAsString("exp"));
                userInfo.put("iat", jwt.getClaimAsString("iat"));
                
            } else {
                logger.warn("Authentication is not JWT type: {}", authentication.getClass());
                userInfo.put("authenticated", true);
                userInfo.put("principal", authentication.getPrincipal().toString());
                userInfo.put("authorities", authentication.getAuthorities());
            }

            logger.info("Returning user info: {}", userInfo);
            return ResponseEntity.ok(userInfo);

        } catch (Exception e) {
            logger.error("Error in whoami endpoint", e);
            Map<String, Object> error = new HashMap<>();
            error.put("error", "Internal server error");
            error.put("message", e.getMessage());
            error.put("authenticated", false);
            return ResponseEntity.status(500).body(error);
        }
    }

    @GetMapping("/profile")
    public ResponseEntity<Map<String, Object>> getUserProfile() {
        logger.info("=== GET PROFILE REQUEST ===");
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            
            if (authentication == null || !authentication.isAuthenticated()) {
                Map<String, Object> error = new HashMap<>();
                error.put("error", "Unauthorized");
                error.put("message", "User not authenticated");
                return ResponseEntity.status(401).body(error);
            }

            Map<String, Object> profile = new HashMap<>();
            
            if (authentication instanceof JwtAuthenticationToken jwtAuth) {
                Jwt jwt = jwtAuth.getToken();
                
                profile.put("id", jwt.getClaimAsString("sub"));
                profile.put("username", jwt.getClaimAsString("preferred_username"));
                profile.put("email", jwt.getClaimAsString("email"));
                profile.put("firstName", jwt.getClaimAsString("given_name"));
                profile.put("lastName", jwt.getClaimAsString("family_name"));
                profile.put("name", jwt.getClaimAsString("name"));
                
                // Extract roles
                Map<String, Object> realmAccess = jwt.getClaim("realm_access");
                List<String> roles = new ArrayList<>();
                if (realmAccess != null && realmAccess.containsKey("roles")) {
                    roles = (List<String>) realmAccess.get("roles");
                }
                profile.put("roles", roles);
                
                // Check specific roles
                profile.put("isCustomer", roles.contains("customer"));
                profile.put("isCarrier", roles.contains("carrier"));
                profile.put("isAdmin", roles.contains("admin"));
            }

            logger.info("Returning profile: {}", profile);
            return ResponseEntity.ok(profile);
            
        } catch (Exception e) {
            logger.error("Error getting user profile", e);
            Map<String, Object> error = new HashMap<>();
            error.put("error", "Internal server error");
            error.put("message", e.getMessage());
            return ResponseEntity.status(500).body(error);
        }
    }

    @PostMapping("/sync")
    public ResponseEntity<Map<String, String>> syncUser() {
        logger.info("=== SYNC USER REQUEST ===");
        try {
            // Esta funcionalidade será implementada quando necessário
            Map<String, String> response = new HashMap<>();
            response.put("message", "User sync endpoint available");
            response.put("status", "not_implemented");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("Error in sync user", e);
            Map<String, String> error = new HashMap<>();
            error.put("error", "Internal server error");
            error.put("message", e.getMessage());
            return ResponseEntity.status(500).body(error);
        }
    }
}