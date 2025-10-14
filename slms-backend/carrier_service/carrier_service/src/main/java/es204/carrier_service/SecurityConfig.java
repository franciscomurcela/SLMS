package es204.carrier_service;

import es204.carrier_service.user.UserSyncFilter;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    private final UserSyncFilter userSyncFilter;

    public SecurityConfig(UserSyncFilter userSyncFilter) {
        this.userSyncFilter = userSyncFilter;
    }

    private final AuthenticationEntryPoint silentEntryPoint = (request, response, authException) -> {
        // send a plain 401 without WWW-Authenticate to avoid browser Basic auth popup
        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        response.getWriter().write("Unauthorized");
    };

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            .authorizeHttpRequests((authz) -> authz
                // Public endpoints
                .requestMatchers(HttpMethod.GET, "/carriers", "/carriers/**").permitAll()
                .requestMatchers("/actuator/health", "/actuator/info").permitAll()
                .requestMatchers("/db/**").permitAll()  // Database test endpoint
                // All other endpoints require authentication
                .anyRequest().authenticated()
            )
            // Enable OAuth2 Resource Server (JWT validation)
            .oauth2ResourceServer(oauth2 -> oauth2
                .jwt(Customizer.withDefaults())
            )
            // Add UserSyncFilter after authentication
            .addFilterAfter(userSyncFilter, UsernamePasswordAuthenticationFilter.class)
            .exceptionHandling((eh) -> eh.authenticationEntryPoint(silentEntryPoint));

        return http.build();
    }

}
