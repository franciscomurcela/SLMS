package es204.user_service.sync;

import com.fasterxml.jackson.databind.ObjectMapper;
import es204.user_service.model.UserDTO;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Service to sync Keycloak users with Supabase Users table
 */
@Service
public class UserSyncService {

    private static final Logger log = LoggerFactory.getLogger(UserSyncService.class);

    @Value("${supabase.url}")
    private String supabaseUrl;

    @Value("${supabase.service-role-key}")
    private String supabaseKey;

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    /**
     * Sync user from Keycloak JWT claims to Supabase
     * Creates user if not exists, updates last_login if exists
     * 
     * @param keycloakId The Keycloak user ID (from JWT 'sub' claim)
     * @param email User email (from JWT 'email' claim)
     * @param preferredUsername Username (from JWT 'preferred_username' claim)
     * @return The synced UserDTO
     */
    public UserDTO syncUser(UUID keycloakId, String email, String preferredUsername) {
        log.info("Syncing user with keycloak_id: {}, email: {}", keycloakId, email);

        // Check if user exists
        UserDTO existingUser = findUserByKeycloakId(keycloakId);

        if (existingUser != null) {
            // User exists, update last_login
            log.info("User exists with id: {}, updating last_login", existingUser.getId());
            UserDTO updated = updateLastLogin(existingUser.getId());
            if (updated != null) {
                log.info("Successfully updated last_login for user: {}", existingUser.getId());
                return updated;
            } else {
                log.warn("Failed to update last_login, returning existing user data");
                return existingUser;
            }
        } else {
            // User doesn't exist, create new
            log.info("User with keycloak_id {} not found, creating new user", keycloakId);
            UserDTO created = createUser(keycloakId, email, preferredUsername);
            if (created != null) {
                log.info("Successfully created user with id: {}", created.getId());
            }
            return created;
        }
    }

    /**
     * Find user by Keycloak ID
     */
    private UserDTO findUserByKeycloakId(UUID keycloakId) {
        try {
            String url = supabaseUrl + "/rest/v1/Users?keycloak_id=eq." + keycloakId + "&select=*";

            HttpHeaders headers = new HttpHeaders();
            headers.set("apikey", supabaseKey);
            headers.set("Authorization", "Bearer " + supabaseKey);
            headers.setContentType(MediaType.APPLICATION_JSON);

            HttpEntity<String> entity = new HttpEntity<>(headers);

            ResponseEntity<String> response = restTemplate.exchange(
                url,
                HttpMethod.GET,
                entity,
                String.class
            );

            if (response.getStatusCode() == HttpStatus.OK) {
                String body = response.getBody();
                if (body != null && !body.equals("[]")) {
                    List<UserDTO> users = objectMapper.readValue(
                        body,
                        objectMapper.getTypeFactory().constructCollectionType(List.class, UserDTO.class)
                    );
                    if (!users.isEmpty()) {
                        return users.get(0);
                    }
                }
            }

            return null;
        } catch (Exception e) {
            log.error("Error finding user by keycloak_id: {}", keycloakId, e);
            return null;
        }
    }

    /**
     * Create new user in Supabase
     */
    private UserDTO createUser(UUID keycloakId, String email, String name) {
        try {
            String url = supabaseUrl + "/rest/v1/Users";

            HttpHeaders headers = new HttpHeaders();
            headers.set("apikey", supabaseKey);
            headers.set("Authorization", "Bearer " + supabaseKey);
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("Prefer", "return=representation");

            Map<String, Object> userPayload = new HashMap<>();
            userPayload.put("keycloak_id", keycloakId.toString());
            userPayload.put("email", email);
            userPayload.put("name", name != null ? name : email);
            userPayload.put("last_login", Instant.now().toString());

            String jsonBody = objectMapper.writeValueAsString(userPayload);

            HttpEntity<String> entity = new HttpEntity<>(jsonBody, headers);

            ResponseEntity<String> response = restTemplate.exchange(
                url,
                HttpMethod.POST,
                entity,
                String.class
            );

            if (response.getStatusCode() == HttpStatus.CREATED) {
                String body = response.getBody();
                if (body != null) {
                    List<UserDTO> users = objectMapper.readValue(
                        body,
                        objectMapper.getTypeFactory().constructCollectionType(List.class, UserDTO.class)
                    );
                    if (!users.isEmpty()) {
                        UserDTO createdUser = users.get(0);
                        log.info("User created successfully with id: {}", createdUser.getId());
                        return createdUser;
                    }
                }
            }

            log.error("Failed to create user, status: {}", response.getStatusCode());
            return null;
        } catch (Exception e) {
            log.error("Error creating user with keycloak_id: {}", keycloakId, e);
            return null;
        }
    }

    /**
     * Update last_login timestamp for existing user
     */
    private UserDTO updateLastLogin(UUID userId) {
        try {
            String url = supabaseUrl + "/rest/v1/Users?id=eq." + userId;

            HttpHeaders headers = new HttpHeaders();
            headers.set("apikey", supabaseKey);
            headers.set("Authorization", "Bearer " + supabaseKey);
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("Prefer", "return=representation");

            String timestamp = Instant.now().toString();
            
            Map<String, Object> updatePayload = new HashMap<>();
            updatePayload.put("last_login", timestamp);

            String jsonBody = objectMapper.writeValueAsString(updatePayload);
            
            log.debug("Updating last_login for user {}: URL={}, payload={}", userId, url, jsonBody);

            HttpEntity<String> entity = new HttpEntity<>(jsonBody, headers);

            ResponseEntity<String> response = restTemplate.exchange(
                url,
                HttpMethod.PATCH,
                entity,
                String.class
            );

            log.debug("Update response: status={}, body={}", response.getStatusCode(), response.getBody());

            if (response.getStatusCode() == HttpStatus.OK) {
                String body = response.getBody();
                if (body != null && !body.equals("[]")) {
                    List<UserDTO> users = objectMapper.readValue(
                        body,
                        objectMapper.getTypeFactory().constructCollectionType(List.class, UserDTO.class)
                    );
                    if (!users.isEmpty()) {
                        log.info("Updated last_login for user: {}", userId);
                        return users.get(0);
                    }
                }
            }

            log.warn("Failed to update last_login for user {}: status={}", userId, response.getStatusCode());
            return null;
        } catch (Exception e) {
            log.error("Error updating last_login for user: {}", userId, e);
            return null;
        }
    }
}
