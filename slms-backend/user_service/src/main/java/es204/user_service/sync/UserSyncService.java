package es204.user_service.sync;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
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
    private final ObjectMapper objectMapper;

    public UserSyncService() {
        this.objectMapper = new ObjectMapper();
        this.objectMapper.registerModule(new JavaTimeModule());
    }

    /**
     * Sync user from Keycloak JWT claims to Supabase
     * Creates user if not exists, updates last_login if exists
     * 
     * @param keycloakId The Keycloak user ID (from JWT 'sub' claim)
     * @param email User email (from JWT 'email' claim)
     * @param preferredUsername Username (from JWT 'preferred_username' claim)
     * @param firstName User first name (from JWT 'given_name' claim)
     * @param lastName User last name (from JWT 'family_name' claim)
     * @return The synced UserDTO
     */
    public UserDTO syncUser(UUID keycloakId, String email, String preferredUsername, String firstName, String lastName) {
        log.info("Syncing user with keycloak_id: {}, email: {}, name: {}, first_name: {}, last_name: {}", 
            keycloakId, email, preferredUsername, firstName, lastName);

        // Try to find user by keycloak_id first
        UserDTO existingUser = findUserByKeycloakId(keycloakId);

        // If not found by keycloak_id, try to find by name (preferred_username)
        if (existingUser == null && preferredUsername != null) {
            log.info("User not found by keycloak_id, trying to find by name: {}", preferredUsername);
            existingUser = findUserByName(preferredUsername);
            
            // If found by name but different keycloak_id, update the keycloak_id
            if (existingUser != null && !keycloakId.equals(existingUser.getKeycloakId())) {
                log.warn("User found by name '{}' but with different keycloak_id. Updating keycloak_id from {} to {}", 
                         preferredUsername, existingUser.getKeycloakId(), keycloakId);
                updateKeycloakId(existingUser.getId(), keycloakId);
                existingUser.setKeycloakId(keycloakId);
            }
        }

        if (existingUser != null) {
            // User exists, update last_login and name fields
            log.info("User exists with id: {}, updating last_login and name fields", existingUser.getId());
            UserDTO updated = updateUserInfo(existingUser.getId(), firstName, lastName);
            if (updated != null) {
                log.info("Successfully updated user info for: {}", existingUser.getId());
                return updated;
            } else {
                log.warn("Failed to update user info, returning existing user data");
                return existingUser;
            }
        } else {
            // User doesn't exist, create new
            log.info("User with keycloak_id {} and name {} not found, creating new user", keycloakId, preferredUsername);
            UserDTO created = createUser(keycloakId, email, preferredUsername, firstName, lastName);
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
            log.error("Error finding user by keycloak_id: {} - Error: {} - Message: {}", 
                keycloakId, e.getClass().getSimpleName(), e.getMessage());
            if (e.getCause() != null) {
                log.error("Caused by: {} - {}", e.getCause().getClass().getSimpleName(), e.getCause().getMessage());
            }
            return null;
        }
    }

    /**
     * Find user by name (preferred_username)
     */
    private UserDTO findUserByName(String name) {
        try {
            String url = supabaseUrl + "/rest/v1/Users?name=eq." + name + "&select=*";

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
                        log.info("Found user by name: {} with id: {}", name, users.get(0).getId());
                        return users.get(0);
                    }
                }
            }

            return null;
        } catch (Exception e) {
            log.error("Error finding user by name: {} - Error: {} - Message: {}", 
                name, e.getClass().getSimpleName(), e.getMessage());
            if (e.getCause() != null) {
                log.error("Caused by: {} - {}", e.getCause().getClass().getSimpleName(), e.getCause().getMessage());
            }
            return null;
        }
    }

    /**
     * Update keycloak_id for an existing user
     */
    private void updateKeycloakId(UUID userId, UUID newKeycloakId) {
        try {
            String url = supabaseUrl + "/rest/v1/Users?id=eq." + userId;

            HttpHeaders headers = new HttpHeaders();
            headers.set("apikey", supabaseKey);
            headers.set("Authorization", "Bearer " + supabaseKey);
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("Prefer", "return=representation");

            Map<String, Object> updatePayload = new HashMap<>();
            updatePayload.put("keycloak_id", newKeycloakId.toString());

            String jsonBody = objectMapper.writeValueAsString(updatePayload);

            HttpEntity<String> entity = new HttpEntity<>(jsonBody, headers);

            ResponseEntity<String> response = restTemplate.exchange(
                url,
                HttpMethod.PATCH,
                entity,
                String.class
            );

            if (response.getStatusCode() == HttpStatus.OK) {
                log.info("Successfully updated keycloak_id for user {}", userId);
            } else {
                log.warn("Failed to update keycloak_id for user {}: status={}", userId, response.getStatusCode());
            }
        } catch (Exception e) {
            log.error("Error updating keycloak_id for user: {}", userId, e);
        }
    }

    /**
     * Create new user in Supabase
     */
    private UserDTO createUser(UUID keycloakId, String email, String name, String firstName, String lastName) {
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
            userPayload.put("first_name", firstName);
            userPayload.put("last_name", lastName);
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
     * Update last_login timestamp and name fields for existing user
     */
    private UserDTO updateUserInfo(UUID userId, String firstName, String lastName) {
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
            if (firstName != null) {
                updatePayload.put("first_name", firstName);
            }
            if (lastName != null) {
                updatePayload.put("last_name", lastName);
            }

            String jsonBody = objectMapper.writeValueAsString(updatePayload);
            
            log.debug("Updating user info for {}: URL={}, payload={}", userId, url, jsonBody);

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
                        log.info("Updated user info for: {}", userId);
                        return users.get(0);
                    }
                }
            }

            log.warn("Failed to update user info for {}: status={}", userId, response.getStatusCode());
            return null;
        } catch (Exception e) {
            log.error("Error updating user info for: {}", userId, e);
            return null;
        }
    }

    /**
     * Update last_login timestamp for existing user (legacy method, kept for compatibility)
     */
    private UserDTO updateLastLogin(UUID userId) {
        return updateUserInfo(userId, null, null);
    }
}
