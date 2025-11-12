package es204.user_service.sync;

import es204.user_service.model.UserDTO;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Service;
import org.springframework.dao.DataAccessException;
import org.springframework.dao.EmptyResultDataAccessException;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * Service to sync Keycloak users with PostgreSQL Users table
 */
@Service("userSyncServiceNew")
public class UserSyncServiceNew {

    private static final Logger log = LoggerFactory.getLogger(UserSyncServiceNew.class);

    @Autowired
    private JdbcTemplate jdbcTemplate;

    /**
     * Sync user from Keycloak JWT claims to PostgreSQL
     * Creates user if not exists, updates last_login if exists
     * Also creates entry in role-specific table (Costumer, Driver, etc.)
     */
    public UserDTO syncUser(UUID keycloakId, String email, String preferredUsername, String firstName, String lastName, List<String> roles) {
        log.info("Syncing user with keycloak_id: {}, email: {}, name: {}, first_name: {}, last_name: {}, roles: {}", 
            keycloakId, email, preferredUsername, firstName, lastName, roles);

        UserDTO existingUser = findUserByKeycloakId(keycloakId);

        if (existingUser == null && preferredUsername != null) {
            log.info("User not found by keycloak_id, trying to find by name: {}", preferredUsername);
            existingUser = findUserByName(preferredUsername);
            
            if (existingUser != null && !keycloakId.equals(existingUser.getKeycloakId())) {
                log.warn("User found by name '{}' but with different keycloak_id. Updating keycloak_id from {} to {}", 
                         preferredUsername, existingUser.getKeycloakId(), keycloakId);
                updateKeycloakId(existingUser.getId(), keycloakId);
                existingUser.setKeycloakId(keycloakId);
            }
        }

        UserDTO syncedUser;
        if (existingUser != null) {
            log.info("User exists with id: {}, updating last_login and name fields", existingUser.getId());
            UserDTO updated = updateUserInfo(existingUser.getId(), firstName, lastName);
            syncedUser = updated != null ? updated : existingUser;
        } else {
            log.info("User with keycloak_id {} and name {} not found, creating new user", keycloakId, preferredUsername);
            UserDTO created = createUser(keycloakId, email, preferredUsername, firstName, lastName);
            if (created == null) {
                log.error("Failed to create user");
                return null;
            }
            syncedUser = created;
        }

        // Create role-specific entries if needed
        if (roles != null && !roles.isEmpty()) {
            createRoleSpecificEntries(syncedUser.getId(), roles);
        }

        return syncedUser;
    }

    private UserDTO findUserByKeycloakId(UUID keycloakId) {
        try {
            String sql = "SELECT id, keycloak_id, email, name, first_name, last_name, created_at, last_login FROM \"Users\" WHERE keycloak_id = ?";
            return jdbcTemplate.queryForObject(sql, new UserRowMapper(), keycloakId);
        } catch (EmptyResultDataAccessException e) {
            return null;
        } catch (DataAccessException e) {
            log.error("Error finding user by keycloak_id: {}", e.getMessage());
            return null;
        }
    }

    private UserDTO findUserByName(String name) {
        try {
            String sql = "SELECT id, keycloak_id, email, name, first_name, last_name, created_at, last_login FROM \"Users\" WHERE name = ?";
            return jdbcTemplate.queryForObject(sql, new UserRowMapper(), name);
        } catch (EmptyResultDataAccessException e) {
            return null;
        } catch (DataAccessException e) {
            log.error("Error finding user by name: {}", e.getMessage());
            return null;
        }
    }

    private void updateKeycloakId(UUID userId, UUID keycloakId) {
        try {
            String sql = "UPDATE \"Users\" SET keycloak_id = ? WHERE id = ?";
            jdbcTemplate.update(sql, keycloakId, userId);
        } catch (DataAccessException e) {
            log.error("Error updating keycloak_id: {}", e.getMessage());
        }
    }

    private UserDTO updateUserInfo(UUID userId, String firstName, String lastName) {
        try {
            String sql = "UPDATE \"Users\" SET first_name = ?, last_name = ?, last_login = CURRENT_TIMESTAMP WHERE id = ?";
            jdbcTemplate.update(sql, firstName, lastName, userId);
            
            // Fetch updated user
            String selectSql = "SELECT id, keycloak_id, email, name, first_name, last_name, created_at, last_login FROM \"Users\" WHERE id = ?";
            return jdbcTemplate.queryForObject(selectSql, new UserRowMapper(), userId);
        } catch (DataAccessException e) {
            log.error("Error updating user info: {}", e.getMessage());
            return null;
        }
    }

    private UserDTO createUser(UUID keycloakId, String email, String preferredUsername, String firstName, String lastName) {
        try {
            UUID userId = UUID.randomUUID();
            String sql = "INSERT INTO \"Users\" (id, keycloak_id, email, name, first_name, last_name, created_at, last_login) " +
                        "VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)";
            
            jdbcTemplate.update(sql, userId, keycloakId, email, preferredUsername, firstName, lastName);
            
            // Return created user
            UserDTO user = new UserDTO();
            user.setId(userId);
            user.setKeycloakId(keycloakId);
            user.setEmail(email);
            user.setName(preferredUsername);
            user.setFirstName(firstName);
            user.setLastName(lastName);
            return user;
            
        } catch (DataAccessException e) {
            log.error("Error creating user: {}", e.getMessage());
            return null;
        }
    }

    private void createRoleSpecificEntries(UUID userId, List<String> roles) {
        for (String role : roles) {
            try {
                switch (role) {
                    case "Driver":
                        createDriverIfNotExists(userId);
                        break;
                    case "Costumer":
                        createCostumerIfNotExists(userId);
                        break;
                    case "Csr":
                        createCsrIfNotExists(userId);
                        break;
                    case "LogisticsManager":
                        createLogisticsManagerIfNotExists(userId);
                        break;
                    case "WarehouseStaff":
                        createWarehouseStaffIfNotExists(userId);
                        break;
                    default:
                        log.debug("Unknown role: {}", role);
                }
            } catch (DataAccessException e) {
                log.warn("Failed to create role-specific entry for role {}: {}", role, e.getMessage());
            }
        }
    }

    private void createDriverIfNotExists(UUID userId) {
        String checkSql = "SELECT COUNT(*) FROM \"Driver\" WHERE user_id = ?";
        Integer count = jdbcTemplate.queryForObject(checkSql, Integer.class, userId);
        
        if (count == null || count == 0) {
            String insertSql = "INSERT INTO \"Driver\" (user_id) VALUES (?)";
            jdbcTemplate.update(insertSql, userId);
            log.info("Created Driver entry for user: {}", userId);
        }
    }

    private void createCostumerIfNotExists(UUID userId) {
        String checkSql = "SELECT COUNT(*) FROM \"Costumer\" WHERE user_id = ?";
        Integer count = jdbcTemplate.queryForObject(checkSql, Integer.class, userId);
        
        if (count == null || count == 0) {
            String insertSql = "INSERT INTO \"Costumer\" (user_id) VALUES (?)";
            jdbcTemplate.update(insertSql, userId);
            log.info("Created Costumer entry for user: {}", userId);
        }
    }

    private void createCsrIfNotExists(UUID userId) {
        String checkSql = "SELECT COUNT(*) FROM \"Csr\" WHERE user_id = ?";
        Integer count = jdbcTemplate.queryForObject(checkSql, Integer.class, userId);
        
        if (count == null || count == 0) {
            String insertSql = "INSERT INTO \"Csr\" (user_id) VALUES (?)";
            jdbcTemplate.update(insertSql, userId);
            log.info("Created Csr entry for user: {}", userId);
        }
    }

    private void createLogisticsManagerIfNotExists(UUID userId) {
        String checkSql = "SELECT COUNT(*) FROM \"LogisticsManager\" WHERE user_id = ?";
        Integer count = jdbcTemplate.queryForObject(checkSql, Integer.class, userId);
        
        if (count == null || count == 0) {
            String insertSql = "INSERT INTO \"LogisticsManager\" (user_id) VALUES (?)";
            jdbcTemplate.update(insertSql, userId);
            log.info("Created LogisticsManager entry for user: {}", userId);
        }
    }

    private void createWarehouseStaffIfNotExists(UUID userId) {
        String checkSql = "SELECT COUNT(*) FROM \"WarehouseStaff\" WHERE user_id = ?";
        Integer count = jdbcTemplate.queryForObject(checkSql, Integer.class, userId);
        
        if (count == null || count == 0) {
            String insertSql = "INSERT INTO \"WarehouseStaff\" (user_id) VALUES (?)";
            jdbcTemplate.update(insertSql, userId);
            log.info("Created WarehouseStaff entry for user: {}", userId);
        }
    }

    private static class UserRowMapper implements RowMapper<UserDTO> {
        @Override
        public UserDTO mapRow(ResultSet rs, int rowNum) throws SQLException {
            UserDTO user = new UserDTO();
            user.setId((UUID) rs.getObject("id"));
            user.setKeycloakId((UUID) rs.getObject("keycloak_id"));
            user.setEmail(rs.getString("email"));
            user.setName(rs.getString("name"));
            user.setFirstName(rs.getString("first_name"));
            user.setLastName(rs.getString("last_name"));
            // Handle timestamps
            if (rs.getTimestamp("created_at") != null) {
                user.setCreatedAt(rs.getTimestamp("created_at").toLocalDateTime());
            }
            if (rs.getTimestamp("last_login") != null) {
                user.setLastLogin(rs.getTimestamp("last_login").toLocalDateTime());
            }
            return user;
        }
    }
}