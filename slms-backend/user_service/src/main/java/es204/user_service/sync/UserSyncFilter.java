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
import java.util.UUID;

/**
 * Filter to automatically sync authenticated Keycloak users with Supabase
 * Runs on every authenticated request to ensure user exists in database
 */
@Component
public class UserSyncFilter implements Filter {

    private static final Logger log = LoggerFactory.getLogger(UserSyncFilter.class);

    private final UserSyncService userSyncService;

    public UserSyncFilter(UserSyncService userSyncService) {
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
                
                if (sub != null) {
                    UUID keycloakId = UUID.fromString(sub);
                    
                    // Sync user to Supabase (create if not exists, update last_login if exists)
                    userSyncService.syncUser(keycloakId, email, preferredUsername, givenName, familyName);
                    
                    log.debug("User synced: keycloak_id={}, email={}, name={} {} {}", 
                        keycloakId, email, preferredUsername, givenName, familyName);
                }
            } catch (Exception e) {
                // Log error but don't block request
                log.error("Error syncing user to Supabase: {}", e.getMessage(), e);
            }
        }

        // Continue with request
        chain.doFilter(request, response);
    }
}
