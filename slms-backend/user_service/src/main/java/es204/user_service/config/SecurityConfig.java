package es204.user_service.config;

import es204.user_service.sync.UserSyncFilter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import java.util.List;

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
            // Enable CORS with custom configuration
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .authorizeHttpRequests((authz) -> authz
                // Public endpoints
                .requestMatchers("/actuator/health", "/actuator/info").permitAll()
                // Allow keycloak ID lookup without authentication (needed for notifications)
                .requestMatchers("/api/users/by-keycloak/**").permitAll()
                // All other user endpoints require authentication
                .requestMatchers("/api/users/**").authenticated()
                .requestMatchers("/user/**").authenticated()
                .anyRequest().authenticated()
            )
            // Enable OAuth2 Resource Server (JWT validation against Keycloak)
            .oauth2ResourceServer(oauth2 -> oauth2.jwt(jwt -> {}));
            // DISABLED: UserSyncFilter (using PostgreSQL now instead of Supabase API)
            // .addFilterAfter(userSyncFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    /**
     * Configure CORS to allow requests from frontend (localhost:5173 and remote IP)
     */
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(List.of(
            "http://localhost:5173",
            "http://localhost:3000",
            "http://192.168.160.9:3000"
        ));
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("*"));
        configuration.setAllowCredentials(true);
        
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
