package es204.carrier_service;

import java.util.List;
import java.util.Map;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/carriers")
public class CarrierController {

    private final JdbcTemplate jdbc;

    public CarrierController(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    @GetMapping
    public List<Map<String, Object>> all() {
        String sql = """
            SELECT 
                carrier_id,
                name,
                avg_cost,
                on_time_rate,
                success_rate,
                cost_history::text as cost_history,
                successful_deliveries,
                failed_deliveries,
                delayed_deliveries,
                total_deliveries
            FROM "Carrier" 
            LIMIT 100
            """;
        return jdbc.queryForList(sql);
    }

    @GetMapping("/health")
    public Map<String, Object> health() {
        try {
            jdbc.queryForObject("SELECT 1", Integer.class);
            return Map.of("status", "ok");
        } catch (Exception e) {
            return Map.of("status", "error", "details", e.getMessage());
        }
    }

}
