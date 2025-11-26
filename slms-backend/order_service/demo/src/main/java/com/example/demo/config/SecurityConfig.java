package com.example.demo.config;

import java.util.List;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

/**
 * Security configuration for Order Service
 * Validates JWT tokens from Keycloak and protects order endpoints
 */
@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            // Enable CORS with custom configuration
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .authorizeHttpRequests((authz) -> authz
                // Public endpoints (AQUI ESTÁ A CORREÇÃO)
                // Permitir Actuator e o Health Check específico de Orders
                .requestMatchers("/actuator/**", "/api/orders/health").permitAll()
                
                // Debug endpoint (mantive o que tinhas, opcional)
                .requestMatchers("/user/health").permitAll()

                // All order endpoints require authentication
                .requestMatchers("/api/orders/**").authenticated()
                .requestMatchers("/api/shipments/**").authenticated()
                
                // User endpoints require authentication
                .requestMatchers("/user/**").authenticated()
                
                // Qualquer outro pedido exige autenticação
                .anyRequest().authenticated()
            )
            // Enable OAuth2 Resource Server (JWT validation against Keycloak)
            .oauth2ResourceServer(oauth2 -> oauth2.jwt(jwt -> {}));

        return http.build();
    }

    /**
     * Configure CORS to allow requests from frontend
     */
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOriginPatterns(List.of("*")); // Allow all origins
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));
        configuration.setAllowedHeaders(List.of("*"));
        configuration.setAllowCredentials(true);
        
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}