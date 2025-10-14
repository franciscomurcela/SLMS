package es204.user_service.config;

import es204.user_service.sync.UserSyncFilter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

/**
 * Security configuration for User Service
 * Validates JWT tokens from Keycloak and protects user endpoints
 */
@Configuration
@EnableWebSecurity
public class SecurityConfig {

    private final UserSyncFilter userSyncFilter;

    public SecurityConfig(UserSyncFilter userSyncFilter) {
        this.userSyncFilter = userSyncFilter;
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            .authorizeHttpRequests((authz) -> authz
                // Public endpoints
                .requestMatchers("/actuator/health", "/actuator/info").permitAll()
                // All user endpoints require authentication
                .requestMatchers("/user/**").authenticated()
                .anyRequest().authenticated()
            )
            // Enable OAuth2 Resource Server (JWT validation against Keycloak)
            .oauth2ResourceServer(oauth2 -> oauth2.jwt(jwt -> {}))
            // Add UserSyncFilter after authentication to sync user with Supabase
            .addFilterAfter(userSyncFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}
