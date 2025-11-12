package es204.user_service.sync;

import jakarta.servlet.*;
import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Filter to automatically sync authenticated Keycloak users with PostgreSQL
 * Runs on every authenticated request to ensure user exists in database
 */
@Component
public class UserSyncFilter implements Filter {

    private static final Logger log = LoggerFactory.getLogger(UserSyncFilter.class);

    private final UserSyncServiceNew userSyncService;

    public UserSyncFilter(UserSyncServiceNew userSyncService) {
        this.userSyncService = userSyncService;
    }

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {

        HttpServletRequest httpRequest = (HttpServletRequest) request;
        
        // Only process authenticated requests
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        
        if (authentication != null && authentication.isAuthenticated() 
                && authentication.getPrincipal() instanceof Jwt) {
            
            Jwt jwt = (Jwt) authentication.getPrincipal();
            
            try {
                // Extract claims from JWT
                String sub = jwt.getClaimAsString("sub");
                String email = jwt.getClaimAsString("email");
                String preferredUsername = jwt.getClaimAsString("preferred_username");
                String givenName = jwt.getClaimAsString("given_name");
                String familyName = jwt.getClaimAsString("family_name");
                
                // Extract roles from JWT
                List<String> roles = extractRoles(jwt);
                
                if (sub != null) {
                    UUID keycloakId = UUID.fromString(sub);
                    
                    // Sync user to Supabase (create if not exists, update last_login if exists)
                    // Also sync to role-specific table (Costumer, Driver, etc.)
                    userSyncService.syncUser(keycloakId, email, preferredUsername, givenName, familyName, roles);
                    
                    log.debug("User synced: keycloak_id={}, email={}, name={} {} {}, roles={}", 
                        keycloakId, email, preferredUsername, givenName, familyName, roles);
                }
            } catch (Exception e) {
                // Log error but don't block request
                log.error("Error syncing user to Supabase: {}", e.getMessage(), e);
            }
        }

        // Continue with request
        chain.doFilter(request, response);
    }

    /**
     * Extract roles from JWT realm_access claim
     * Filters to only include app-specific roles
     */
    private List<String> extractRoles(Jwt jwt) {
        List<String> roles = new ArrayList<>();
        
        try {
            // Get realm_access claim
            Map<String, Object> realmAccess = jwt.getClaimAsMap("realm_access");
            
            if (realmAccess != null && realmAccess.containsKey("roles")) {
                @SuppressWarnings("unchecked")
                List<String> allRoles = (List<String>) realmAccess.get("roles");
                
                // Filter to only app-specific roles
                List<String> appRoles = List.of("Customer", "Driver", "Logistics_Manager", "Warehouse_Staff", "Csr");
                
                if (allRoles != null) {
                    for (String role : allRoles) {
                        if (appRoles.contains(role)) {
                            roles.add(role);
                        }
                    }
                }
            }
        } catch (Exception e) {
            log.error("Error extracting roles from JWT: {}", e.getMessage());
        }
        
        return roles;
    }
}
