package es204.user_service.model;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import org.junit.jupiter.api.Test;

class UserDTOTest {
    @Test
    void testUserDTOSettersAndGetters() {
        UUID keycloakId = UUID.randomUUID();
        UUID id = UUID.randomUUID();
        UserDTO user = new UserDTO();
        user.setId(id);
        user.setName("Test User");
        user.setFirstName("Test");
        user.setLastName("User");
        user.setEmail("test@example.com");
        user.setKeycloakId(keycloakId);

        assertEquals(id, user.getId());
        assertEquals("Test User", user.getName());
        assertEquals("Test", user.getFirstName());
        assertEquals("User", user.getLastName());
        assertEquals("test@example.com", user.getEmail());
        assertEquals(keycloakId, user.getKeycloakId());
        assertNotNull(user.getLastLogin());
    }
}
