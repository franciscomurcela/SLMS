package es204.user_service.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.UUID;
import java.time.Instant;

/**
 * DTO for User entity in Supabase
 */
public class UserDTO {
    
    @JsonProperty("id")
    private UUID id;
    
    @JsonProperty("name")
    private String name;
    
    @JsonProperty("email")
    private String email;
    
    @JsonProperty("keycloak_id")
    private UUID keycloakId;
    
    @JsonProperty("last_login")
    private Instant lastLogin;

    // Constructors
    public UserDTO() {}

    public UserDTO(UUID keycloakId, String name, String email) {
        this.keycloakId = keycloakId;
        this.name = name;
        this.email = email;
        this.lastLogin = Instant.now();
    }

    // Getters and Setters
    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public UUID getKeycloakId() {
        return keycloakId;
    }

    public void setKeycloakId(UUID keycloakId) {
        this.keycloakId = keycloakId;
    }

    public Instant getLastLogin() {
        return lastLogin;
    }

    public void setLastLogin(Instant lastLogin) {
        this.lastLogin = lastLogin;
    }
}
