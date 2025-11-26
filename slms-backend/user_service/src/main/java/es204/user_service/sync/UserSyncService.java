package es204.user_service.sync;

import es204.user_service.model.UserDTO;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Service to sync Keycloak users with PostgreSQL Users table
 */
@Service
public class UserSyncService {

    private static final Logger log = LoggerFactory.getLogger(UserSyncService.class);

    @Autowired
    private JdbcTemplate jdbcTemplate;

    /**
     * Sync user from Keycloak JWT claims to PostgreSQL
     * Creates user if not exists, updates last_login if exists
     * Also creates entry in role-specific table (Customer, Driver, etc.)
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

        try {
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
        } catch (Exception e) {
            log.error("Error syncing user: {}", e.getMessage(), e);
            return null;
        }
    }

    /**
     * Find user by Keycloak ID using PostgreSQL
     */
    private UserDTO findUserByKeycloakId(UUID keycloakId) {
        try {
            String sql = "SELECT * FROM \"Users\" WHERE keycloak_id = ?";
            List<Map<String, Object>> rows = jdbcTemplate.queryForList(sql, keycloakId);
            
            if (!rows.isEmpty()) {
                Map<String, Object> row = rows.get(0);
                return mapRowToUserDTO(row);
            }
            
            return null;
        } catch (Exception e) {
            log.error("Error finding user by keycloak_id {}: {}", keycloakId, e.getMessage());
            // Return null instead of throwing exception to prevent service startup failure
            return null;
        }
    }

    /**
     * Find user by username using PostgreSQL
     */
    private UserDTO findUserByName(String name) {
        try {
            String sql = "SELECT * FROM \"Users\" WHERE name = ?";
            List<Map<String, Object>> rows = jdbcTemplate.queryForList(sql, name);
            
            if (!rows.isEmpty()) {
                Map<String, Object> row = rows.get(0);
                return mapRowToUserDTO(row);
            }
            
            return null;
        } catch (Exception e) {
            log.error("Error finding user by name {}: {}", name, e.getMessage());
            return null;
        }
    }

    /**
     * Update keycloak_id for existing user
     */
    private void updateKeycloakId(UUID userId, UUID newKeycloakId) {
        try {
            String sql = "UPDATE \"Users\" SET keycloak_id = ? WHERE id = ?";
            int updated = jdbcTemplate.update(sql, newKeycloakId, userId);
            if (updated > 0) {
                log.info("Updated keycloak_id for user {} to {}", userId, newKeycloakId);
            }
        } catch (Exception e) {
            log.error("Error updating keycloak_id for user {}: {}", userId, e.getMessage());
        }
    }

    /**
     * Update user information
     */
    private UserDTO updateUserInfo(UUID userId, String firstName, String lastName) {
        try {
            String sql = "UPDATE \"Users\" SET first_name = ?, last_name = ?, last_login = CURRENT_TIMESTAMP WHERE id = ?";
            int updated = jdbcTemplate.update(sql, firstName, lastName, userId);
            
            if (updated > 0) {
                return findUserById(userId);
            } else {
                log.warn("No rows updated for user: {}", userId);
                return null;
            }
        } catch (Exception e) {
            log.error("Error updating user info for {}: {}", userId, e.getMessage());
            return null;
        }
    }

    /**
     * Create new user
     */
    private UserDTO createUser(UUID keycloakId, String email, String name, String firstName, String lastName) {
        try {
            UUID newUserId = UUID.randomUUID();
            String sql = "INSERT INTO \"Users\" (id, keycloak_id, email, name, first_name, last_name, created_at, last_login) VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)";
            
            int inserted = jdbcTemplate.update(sql, newUserId, keycloakId, email, name, firstName, lastName);
            
            if (inserted > 0) {
                return findUserById(newUserId);
            } else {
                log.error("Failed to insert user");
                return null;
            }
        } catch (Exception e) {
            log.error("Error creating user: {}", e.getMessage());
            return null;
        }
    }

    /**
     * Find user by ID
     */
    private UserDTO findUserById(UUID userId) {
        try {
            String sql = "SELECT * FROM \"Users\" WHERE id = ?";
            List<Map<String, Object>> rows = jdbcTemplate.queryForList(sql, userId);
            
            if (!rows.isEmpty()) {
                return mapRowToUserDTO(rows.get(0));
            }
            
            return null;
        } catch (Exception e) {
            log.error("Error finding user by id {}: {}", userId, e.getMessage());
            return null;
        }
    }

    /**
     * Map database row to UserDTO
     */
    private UserDTO mapRowToUserDTO(Map<String, Object> row) {
        UserDTO user = new UserDTO();
        user.setId((UUID) row.get("id"));
        user.setKeycloakId((UUID) row.get("keycloak_id"));
        user.setEmail((String) row.get("email"));
        user.setName((String) row.get("name"));
        user.setFirstName((String) row.get("first_name"));
        user.setLastName((String) row.get("last_name"));
        
        // Handle last_login timestamp safely
        Object lastLogin = row.get("last_login");
        if (lastLogin != null) {
            if (lastLogin instanceof java.sql.Timestamp) {
                user.setLastLogin(((java.sql.Timestamp) lastLogin).toInstant());
            } else {
                user.setLastLogin(Instant.parse(lastLogin.toString()));
            }
        }
        
        return user;
    }

    /**
     * Sync user to role-specific tables
     */
    private void syncUserToRoleTable(UUID userId, List<String> roles) {
        for (String role : roles) {
            try {
                switch (role.toLowerCase()) {
                    case "driver":
                        syncToDriverTable(userId);
                        break;
                    case "costumer":
                    case "customer":
                        syncToCostumerTable(userId);
                        break;
                    case "csr":
                        syncToCsrTable(userId);
                        break;
                    case "logisticsmanager":
                        syncToLogisticsManagerTable(userId);
                        break;
                    case "warehousestaff":
                        syncToWarehouseStaffTable(userId);
                        break;
                    default:
                        log.warn("Unknown role: {}", role);
                }
            } catch (Exception e) {
                log.error("Error syncing user {} to role table {}: {}", userId, role, e.getMessage());
            }
        }
    }

    private void syncToDriverTable(UUID userId) {
        try {
            String checkSql = "SELECT COUNT(*) FROM \"Driver\" WHERE user_id = ?";
            Integer count = jdbcTemplate.queryForObject(checkSql, Integer.class, userId);
            
            if (count != null && count == 0) {
                String insertSql = "INSERT INTO \"Driver\" (user_id) VALUES (?)";
                jdbcTemplate.update(insertSql, userId);
                log.info("Created Driver entry for user {}", userId);
            }
        } catch (Exception e) {
            log.error("Error syncing to Driver table for user {}: {}", userId, e.getMessage());
        }
    }

    private void syncToCostumerTable(UUID userId) {
        try {
            String checkSql = "SELECT COUNT(*) FROM \"Costumer\" WHERE user_id = ?";
            Integer count = jdbcTemplate.queryForObject(checkSql, Integer.class, userId);
            
            if (count != null && count == 0) {
                String insertSql = "INSERT INTO \"Costumer\" (user_id) VALUES (?)";
                jdbcTemplate.update(insertSql, userId);
                log.info("Created Costumer entry for user {}", userId);
            }
        } catch (Exception e) {
            log.error("Error syncing to Costumer table for user {}: {}", userId, e.getMessage());
        }
    }

    private void syncToCsrTable(UUID userId) {
        try {
            String checkSql = "SELECT COUNT(*) FROM \"Csr\" WHERE user_id = ?";
            Integer count = jdbcTemplate.queryForObject(checkSql, Integer.class, userId);
            
            if (count != null && count == 0) {
                String insertSql = "INSERT INTO \"Csr\" (user_id) VALUES (?)";
                jdbcTemplate.update(insertSql, userId);
                log.info("Created Csr entry for user {}", userId);
            }
        } catch (Exception e) {
            log.error("Error syncing to Csr table for user {}: {}", userId, e.getMessage());
        }
    }

    private void syncToLogisticsManagerTable(UUID userId) {
        try {
            String checkSql = "SELECT COUNT(*) FROM \"LogisticsManager\" WHERE user_id = ?";
            Integer count = jdbcTemplate.queryForObject(checkSql, Integer.class, userId);
            
            if (count != null && count == 0) {
                String insertSql = "INSERT INTO \"LogisticsManager\" (user_id) VALUES (?)";
                jdbcTemplate.update(insertSql, userId);
                log.info("Created LogisticsManager entry for user {}", userId);
            }
        } catch (Exception e) {
            log.error("Error syncing to LogisticsManager table for user {}: {}", userId, e.getMessage());
        }
    }

    private void syncToWarehouseStaffTable(UUID userId) {
        try {
            String checkSql = "SELECT COUNT(*) FROM \"WarehouseStaff\" WHERE user_id = ?";
            Integer count = jdbcTemplate.queryForObject(checkSql, Integer.class, userId);
            
            if (count != null && count == 0) {
                String insertSql = "INSERT INTO \"WarehouseStaff\" (user_id) VALUES (?)";
                jdbcTemplate.update(insertSql, userId);
                log.info("Created WarehouseStaff entry for user {}", userId);
            }
        } catch (Exception e) {
            log.error("Error syncing to WarehouseStaff table for user {}: {}", userId, e.getMessage());
        }
    }

    /**
     * Get user info by Keycloak ID (public method for controllers)
     */
    public UserDTO getUserByKeycloakId(UUID keycloakId) {
        return findUserByKeycloakId(keycloakId);
    }

    /**
     * Check if user exists by Keycloak ID
     */
    public boolean userExists(UUID keycloakId) {
        return findUserByKeycloakId(keycloakId) != null;
    }
}
