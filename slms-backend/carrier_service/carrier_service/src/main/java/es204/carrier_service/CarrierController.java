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
        return jdbc.queryForList("SELECT * FROM \"Carrier\" LIMIT 100");
    }

}
