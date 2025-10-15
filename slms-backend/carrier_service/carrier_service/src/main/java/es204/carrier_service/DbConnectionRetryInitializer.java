package es204.carrier_service;

import java.sql.Connection;

import javax.sql.DataSource;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.SmartLifecycle;
import org.springframework.stereotype.Component;

/**
 * During application startup attempt to obtain a JDBC connection with retries.
 * This prevents the application from failing immediately when the DB pool is
 * temporarily exhausted or the network has transient errors.
 */
@Component
public class DbConnectionRetryInitializer implements SmartLifecycle {

    private static final Logger log = LoggerFactory.getLogger(DbConnectionRetryInitializer.class);

    private final DataSource dataSource;

    @Value("${app.db.startup.retries:5}")
    private int maxRetries;

    @Value("${app.db.startup.delay-millis:2000}")
    private long delayMillis;

    private volatile boolean running = false;

    public DbConnectionRetryInitializer(DataSource dataSource) {
        this.dataSource = dataSource;
    }

    @Override
    public void start() {
        log.info("DbConnectionRetryInitializer starting (maxRetries={}, delayMillis={})", maxRetries, delayMillis);
        int attempt = 0;
        while (attempt <= maxRetries) {
            attempt++;
            try (Connection c = dataSource.getConnection()) {
                log.info("Successfully obtained JDBC connection on attempt {}/{}", attempt, maxRetries);
                running = true;
                return;
            } catch (Exception e) {
                log.warn("Attempt {}/{} to obtain JDBC connection failed: {}", attempt, maxRetries, e.toString());
                if (attempt > maxRetries) {
                    log.error("Exceeded max retries to obtain JDBC connection, proceeding with startup (will surface errors later)");
                    // Do not rethrow to avoid preventing the application from starting entirely.
                    return;
                }
                try {
                    Thread.sleep(delayMillis);
                } catch (InterruptedException ie) {
                    Thread.currentThread().interrupt();
                    return;
                }
            }
        }
    }

    @Override
    public void stop() {
        running = false;
    }

    @Override
    public boolean isRunning() {
        return running;
    }

    @Override
    public int getPhase() {
        // run early in the lifecycle
        return Integer.MIN_VALUE + 100;
    }

    @Override
    public boolean isAutoStartup() {
        return true;
    }

}
