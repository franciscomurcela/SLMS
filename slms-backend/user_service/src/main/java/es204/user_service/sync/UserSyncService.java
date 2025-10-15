package es204.user_service.sync;

import com.fasterxml.jackson.databind.DeserializationFeature;
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
        // Configure to handle Supabase's microsecond precision timestamps
        this.objectMapper.configure(DeserializationFeature.ADJUST_DATES_TO_CONTEXT_TIME_ZONE, false);
        this.objectMapper.configure(DeserializationFeature.READ_DATE_TIMESTAMPS_AS_NANOSECONDS, false);
    }

    /**
     * Sync user from Keycloak JWT claims to Supabase
     * Creates user if not exists, updates last_login if exists
     * Also creates entry in role-specific table (Costumer, Driver, etc.)
     * 
     * @param keycloakId The Keycloak user ID (from JWT 'sub' claim)
     * @param email User email (from JWT 'email' claim)
     * @param preferredUsername Username (from JWT 'preferred_username' claim)
     * @param firstName User first name (from JWT 'given_name' claim)
     * @param lastName User last name (from JWT 'family_name' claim)
     * @param roles List of roles from Keycloak
     * @return The synced UserDTO
     */
    public UserDTO syncUser(UUID keycloakId, String email, String preferredUsername, String firstName, String lastName, List<String> roles) {
        log.info("Syncing user with keycloak_id: {}, email: {}, name: {}, first_name: {}, last_name: {}, roles: {}", 
            keycloakId, email, preferredUsername, firstName, lastName, roles);

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

        UserDTO syncedUser;
        if (existingUser != null) {
            // User exists, update last_login and name fields
            log.info("User exists with id: {}, updating last_login and name fields", existingUser.getId());
            UserDTO updated = updateUserInfo(existingUser.getId(), firstName, lastName);
            if (updated != null) {
                log.info("Successfully updated user info for: {}", existingUser.getId());
                syncedUser = updated;
            } else {
                log.warn("Failed to update user info, returning existing user data");
                syncedUser = existingUser;
            }
        } else {
            // User doesn't exist, create new
            log.info("User with keycloak_id {} and name {} not found, creating new user", keycloakId, preferredUsername);
            UserDTO created = createUser(keycloakId, email, preferredUsername, firstName, lastName);
            if (created != null) {
                log.info("Successfully created user with id: {}", created.getId());
                syncedUser = created;
            } else {
                log.error("Failed to create user");
                return null;
            }
        }

        // Sync user to role-specific table
        if (syncedUser != null && roles != null && !roles.isEmpty()) {
            syncUserToRoleTable(syncedUser.getId(), roles);
        }

        return syncedUser;
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
     * Sync user to role-specific table based on their roles
     * Determines primary role using priority: Logistics_Manager > Driver > Warehouse_Staff > Customer > Csr
     */
    private void syncUserToRoleTable(UUID userId, List<String> roles) {
        log.info("Syncing user {} to role-specific table. Roles: {}", userId, roles);

        // Determine primary role based on priority
        String primaryRole = determinePrimaryRole(roles);
        
        if (primaryRole == null) {
            log.warn("No valid role found for user {}", userId);
            return;
        }

        log.info("Primary role for user {} is: {}", userId, primaryRole);

        // Sync to appropriate table based on role
        switch (primaryRole) {
            case "Logistics_Manager":
                syncLogisticsManager(userId);
                break;
            case "Driver":
                syncDriver(userId);
                break;
            case "Warehouse_Staff":
                syncWarehouseStaff(userId);
                break;
            case "Customer":
                syncCustomer(userId);
                break;
            case "Csr":
                syncCsr(userId);
                break;
            default:
                log.warn("Unknown role: {} for user {}", primaryRole, userId);
        }
    }

    /**
     * Determine primary role using priority order
     */
    private String determinePrimaryRole(List<String> roles) {
        if (roles.contains("Logistics_Manager")) return "Logistics_Manager";
        if (roles.contains("Driver")) return "Driver";
        if (roles.contains("Warehouse_Staff")) return "Warehouse_Staff";
        if (roles.contains("Customer")) return "Customer";
        if (roles.contains("Csr")) return "Csr";
        return null;
    }

    /**
     * Sync user to LogisticsManager table
     */
    private void syncLogisticsManager(UUID userId) {
        try {
            // Check if already exists
            String checkUrl = supabaseUrl + "/rest/v1/LogisticsManager?user_id=eq." + userId;
            HttpHeaders headers = new HttpHeaders();
            headers.set("apikey", supabaseKey);
            headers.set("Authorization", "Bearer " + supabaseKey);
            
            HttpEntity<String> checkEntity = new HttpEntity<>(headers);
            ResponseEntity<String> checkResponse = restTemplate.exchange(checkUrl, HttpMethod.GET, checkEntity, String.class);
            
            if (checkResponse.getBody() != null && !checkResponse.getBody().equals("[]")) {
                log.info("User {} already exists in LogisticsManager table", userId);
                return;
            }

            // Insert new entry
            String insertUrl = supabaseUrl + "/rest/v1/LogisticsManager";
            headers.setContentType(MediaType.APPLICATION_JSON);
            String jsonBody = "{\"user_id\":\"" + userId + "\"}";
            HttpEntity<String> insertEntity = new HttpEntity<>(jsonBody, headers);
            
            restTemplate.exchange(insertUrl, HttpMethod.POST, insertEntity, String.class);
            log.info("Successfully synced user {} to LogisticsManager table", userId);
        } catch (Exception e) {
            log.error("Error syncing user {} to LogisticsManager table: {}", userId, e.getMessage());
        }
    }

    /**
     * Get a random carrier ID from the Carrier table
     */
    private UUID getRandomCarrierId() {
        try {
            // Get all carriers
            String url = supabaseUrl + "/rest/v1/Carrier?select=carrier_id";
            HttpHeaders headers = new HttpHeaders();
            headers.set("apikey", supabaseKey);
            headers.set("Authorization", "Bearer " + supabaseKey);
            
            HttpEntity<String> entity = new HttpEntity<>(headers);
            ResponseEntity<String> response = restTemplate.exchange(url, HttpMethod.GET, entity, String.class);
            
            if (response.getBody() != null && !response.getBody().equals("[]")) {
                // Parse the JSON array to get carrier IDs
                List<Map<String, String>> carriers = objectMapper.readValue(
                    response.getBody(), 
                    new com.fasterxml.jackson.core.type.TypeReference<List<Map<String, String>>>() {}
                );
                
                if (!carriers.isEmpty()) {
                    // Pick a random carrier
                    int randomIndex = (int) (Math.random() * carriers.size());
                    String carrierIdStr = carriers.get(randomIndex).get("carrier_id");
                    UUID carrierId = UUID.fromString(carrierIdStr);
                    log.info("Randomly selected carrier: {}", carrierId);
                    return carrierId;
                }
            }
            
            log.warn("No carriers found in database");
            return null;
        } catch (Exception e) {
            log.error("Error getting random carrier: {}", e.getMessage());
            return null;
        }
    }

    /**
     * Sync user to Driver table with a random carrier assignment
     */
    private void syncDriver(UUID userId) {
        try {
            String checkUrl = supabaseUrl + "/rest/v1/Driver?user_id=eq." + userId;
            HttpHeaders headers = new HttpHeaders();
            headers.set("apikey", supabaseKey);
            headers.set("Authorization", "Bearer " + supabaseKey);
            headers.set("Prefer", "return=minimal");
            
            HttpEntity<String> checkEntity = new HttpEntity<>(headers);
            ResponseEntity<String> checkResponse = restTemplate.exchange(checkUrl, HttpMethod.GET, checkEntity, String.class);
            
            if (checkResponse.getBody() != null && !checkResponse.getBody().equals("[]")) {
                log.info("User {} already exists in Driver table", userId);
                return;
            }

            // Get a random carrier
            UUID carrierId = getRandomCarrierId();
            
            String insertUrl = supabaseUrl + "/rest/v1/Driver";
            headers.setContentType(MediaType.APPLICATION_JSON);
            
            String jsonBody;
            if (carrierId != null) {
                jsonBody = "{\"user_id\":\"" + userId + "\",\"carrier_id\":\"" + carrierId + "\"}";
                log.info("Assigning driver {} to carrier {}", userId, carrierId);
            } else {
                jsonBody = "{\"user_id\":\"" + userId + "\",\"carrier_id\":null}";
                log.warn("No carrier available, creating driver {} without carrier", userId);
            }
            
            HttpEntity<String> insertEntity = new HttpEntity<>(jsonBody, headers);
            
            restTemplate.exchange(insertUrl, HttpMethod.POST, insertEntity, String.class);
            log.info("Successfully synced user {} to Driver table", userId);
        } catch (Exception e) {
            log.error("Error syncing user {} to Driver table: {}", userId, e.getMessage());
        }
    }

    /**
     * Sync user to WarehouseStaff table
     */
    private void syncWarehouseStaff(UUID userId) {
        try {
            String checkUrl = supabaseUrl + "/rest/v1/WarehouseStaff?user_id=eq." + userId;
            HttpHeaders headers = new HttpHeaders();
            headers.set("apikey", supabaseKey);
            headers.set("Authorization", "Bearer " + supabaseKey);
            
            HttpEntity<String> checkEntity = new HttpEntity<>(headers);
            ResponseEntity<String> checkResponse = restTemplate.exchange(checkUrl, HttpMethod.GET, checkEntity, String.class);
            
            if (checkResponse.getBody() != null && !checkResponse.getBody().equals("[]")) {
                log.info("User {} already exists in WarehouseStaff table", userId);
                return;
            }

            String insertUrl = supabaseUrl + "/rest/v1/WarehouseStaff";
            headers.setContentType(MediaType.APPLICATION_JSON);
            String jsonBody = "{\"user_id\":\"" + userId + "\"}";
            HttpEntity<String> insertEntity = new HttpEntity<>(jsonBody, headers);
            
            restTemplate.exchange(insertUrl, HttpMethod.POST, insertEntity, String.class);
            log.info("Successfully synced user {} to WarehouseStaff table", userId);
        } catch (Exception e) {
            log.error("Error syncing user {} to WarehouseStaff table: {}", userId, e.getMessage());
        }
    }

    /**
     * Sync user to Costumer table
     */
    private void syncCustomer(UUID userId) {
        try {
            String checkUrl = supabaseUrl + "/rest/v1/Costumer?user_id=eq." + userId;
            HttpHeaders headers = new HttpHeaders();
            headers.set("apikey", supabaseKey);
            headers.set("Authorization", "Bearer " + supabaseKey);
            
            HttpEntity<String> checkEntity = new HttpEntity<>(headers);
            ResponseEntity<String> checkResponse = restTemplate.exchange(checkUrl, HttpMethod.GET, checkEntity, String.class);
            
            if (checkResponse.getBody() != null && !checkResponse.getBody().equals("[]")) {
                log.info("User {} already exists in Costumer table", userId);
                return;
            }

            String insertUrl = supabaseUrl + "/rest/v1/Costumer";
            headers.setContentType(MediaType.APPLICATION_JSON);
            String jsonBody = "{\"user_id\":\"" + userId + "\"}";
            HttpEntity<String> insertEntity = new HttpEntity<>(jsonBody, headers);
            
            restTemplate.exchange(insertUrl, HttpMethod.POST, insertEntity, String.class);
            log.info("Successfully synced user {} to Costumer table", userId);
        } catch (Exception e) {
            log.error("Error syncing user {} to Costumer table: {}", userId, e.getMessage());
        }
    }

    /**
     * Sync user to Csr table
     */
    private void syncCsr(UUID userId) {
        try {
            String checkUrl = supabaseUrl + "/rest/v1/Csr?user_id=eq." + userId;
            HttpHeaders headers = new HttpHeaders();
            headers.set("apikey", supabaseKey);
            headers.set("Authorization", "Bearer " + supabaseKey);
            
            HttpEntity<String> checkEntity = new HttpEntity<>(headers);
            ResponseEntity<String> checkResponse = restTemplate.exchange(checkUrl, HttpMethod.GET, checkEntity, String.class);
            
            if (checkResponse.getBody() != null && !checkResponse.getBody().equals("[]")) {
                log.info("User {} already exists in Csr table", userId);
                return;
            }

            String insertUrl = supabaseUrl + "/rest/v1/Csr";
            headers.setContentType(MediaType.APPLICATION_JSON);
            String jsonBody = "{\"user_id\":\"" + userId + "\"}";
            HttpEntity<String> insertEntity = new HttpEntity<>(jsonBody, headers);
            
            restTemplate.exchange(insertUrl, HttpMethod.POST, insertEntity, String.class);
            log.info("Successfully synced user {} to Csr table", userId);
        } catch (Exception e) {
            log.error("Error syncing user {} to Csr table: {}", userId, e.getMessage());
        }
    }

    /**
     * Update last_login timestamp for existing user (legacy method, kept for compatibility)
     */
    private UserDTO updateLastLogin(UUID userId) {
        return updateUserInfo(userId, null, null);
    }
}
