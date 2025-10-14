package es204.carrier_service;

import java.util.List;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/db")
public class DatabaseController {

    private final JdbcTemplate jdbc;

    public DatabaseController(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    @GetMapping("/ping")
    public ResponseEntity<?> ping() {
        try {
            jdbc.execute("SELECT 1");
            return ResponseEntity.ok(Map.of("status", "ok"));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("status", "error", "error", e.getMessage()));
        }
    }

    @GetMapping("/tables")
    public List<String> tables() {
        String sql = "SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_type='BASE TABLE'";
        return jdbc.queryForList(sql, String.class);
    }

    /**
     * Basic ad-hoc SELECT runner for quick verification. Only allows SELECT queries
     * and enforces a client-provided limit (max 100). This is intended for dev/debug
     * only.
     */
    @GetMapping("/query")
    public List<Map<String, Object>> query(
            @RequestParam(defaultValue = "SELECT 1") String sql,
            @RequestParam(defaultValue = "10") int limit) {
        String lower = sql.trim().toLowerCase();
        if (!lower.startsWith("select")) {
            throw new IllegalArgumentException("Only SELECT queries are allowed");
        }
        int safeLimit = Math.max(1, Math.min(limit, 100));
        String limitedSql = sql + " LIMIT " + safeLimit;
        return jdbc.queryForList(limitedSql);
    }

}
