-- Reset and recalculate carrier metrics with simple, consistent logic
UPDATE "Carrier"
SET 
    -- Generate cost history
    cost_history = jsonb_build_object(
        '06/25', (avg_cost * 0.92)::numeric(10,2),
        '07/25', (avg_cost * 0.94)::numeric(10,2),
        '08/25', (avg_cost * 0.96)::numeric(10,2),
        '09/25', (avg_cost * 0.97)::numeric(10,2),
        '10/25', (avg_cost * 0.98)::numeric(10,2),
        '11/25', (avg_cost * 0.99)::numeric(10,2),
        '12/25', avg_cost
    ),
    -- Generate base total between 200-500
    total_deliveries = (200 + (EXTRACT(EPOCH FROM NOW())::INTEGER + ASCII(SUBSTRING(name, 1, 1))) % 300),
    -- Successful = success_rate * total
    successful_deliveries = floor(success_rate * (200 + (EXTRACT(EPOCH FROM NOW())::INTEGER + ASCII(SUBSTRING(name, 1, 1))) % 300))::INTEGER,
    -- Delayed = (1 - on_time_rate) * successful * 0.5
    delayed_deliveries = floor((1 - on_time_rate) * success_rate * (200 + (EXTRACT(EPOCH FROM NOW())::INTEGER + ASCII(SUBSTRING(name, 1, 1))) % 300) * 0.5)::INTEGER,
    -- Failed = (1 - success_rate) * total
    failed_deliveries = floor((1 - success_rate) * (200 + (EXTRACT(EPOCH FROM NOW())::INTEGER + ASCII(SUBSTRING(name, 1, 1))) % 300))::INTEGER
WHERE avg_cost IS NOT NULL;

-- Recalculate total to ensure consistency
UPDATE "Carrier"
SET total_deliveries = successful_deliveries + delayed_deliveries + failed_deliveries;

-- Add constraint
ALTER TABLE "Carrier"
ADD CONSTRAINT chk_carrier_metrics_consistency 
CHECK (
    total_deliveries >= 0 AND
    successful_deliveries >= 0 AND
    failed_deliveries >= 0 AND
    delayed_deliveries >= 0 AND
    total_deliveries = (successful_deliveries + failed_deliveries + delayed_deliveries)
);
