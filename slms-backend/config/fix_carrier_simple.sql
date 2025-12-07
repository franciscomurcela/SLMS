-- Simple approach: set explicit values based on carrier name
UPDATE "Carrier"
SET 
    cost_history = jsonb_build_object(
        '06/25', (avg_cost * 0.92)::numeric(10,2),
        '07/25', (avg_cost * 0.94)::numeric(10,2),
        '08/25', (avg_cost * 0.96)::numeric(10,2),
        '09/25', (avg_cost * 0.97)::numeric(10,2),
        '10/25', (avg_cost * 0.98)::numeric(10,2),
        '11/25', (avg_cost * 0.99)::numeric(10,2),
        '12/25', avg_cost
    ),
    total_deliveries = 350,
    successful_deliveries = floor(350 * success_rate)::INTEGER,
    failed_deliveries = floor(350 * (1 - success_rate) * 0.7)::INTEGER,
    delayed_deliveries = floor(350 * (1 - success_rate) * 0.3)::INTEGER
WHERE name = 'FedEx';

UPDATE "Carrier"
SET 
    cost_history = jsonb_build_object(
        '06/25', (avg_cost * 0.92)::numeric(10,2),
        '07/25', (avg_cost * 0.94)::numeric(10,2),
        '08/25', (avg_cost * 0.96)::numeric(10,2),
        '09/25', (avg_cost * 0.97)::numeric(10,2),
        '10/25', (avg_cost * 0.98)::numeric(10,2),
        '11/25', (avg_cost * 0.99)::numeric(10,2),
        '12/25', avg_cost
    ),
    total_deliveries = 420,
    successful_deliveries = floor(420 * success_rate)::INTEGER,
    failed_deliveries = floor(420 * (1 - success_rate) * 0.7)::INTEGER,
    delayed_deliveries = floor(420 * (1 - success_rate) * 0.3)::INTEGER
WHERE name = 'UPS';

UPDATE "Carrier"
SET 
    cost_history = jsonb_build_object(
        '06/25', (avg_cost * 0.92)::numeric(10,2),
        '07/25', (avg_cost * 0.94)::numeric(10,2),
        '08/25', (avg_cost * 0.96)::numeric(10,2),
        '09/25', (avg_cost * 0.97)::numeric(10,2),
        '10/25', (avg_cost * 0.98)::numeric(10,2),
        '11/25', (avg_cost * 0.99)::numeric(10,2),
        '12/25', avg_cost
    ),
    total_deliveries = 280,
    successful_deliveries = floor(280 * success_rate)::INTEGER,
    failed_deliveries = floor(280 * (1 - success_rate) * 0.7)::INTEGER,
    delayed_deliveries = floor(280 * (1 - success_rate) * 0.3)::INTEGER
WHERE name = 'DPD';

UPDATE "Carrier"
SET 
    cost_history = jsonb_build_object(
        '06/25', (avg_cost * 0.92)::numeric(10,2),
        '07/25', (avg_cost * 0.94)::numeric(10,2),
        '08/25', (avg_cost * 0.96)::numeric(10,2),
        '09/25', (avg_cost * 0.97)::numeric(10,2),
        '10/25', (avg_cost * 0.98)::numeric(10,2),
        '11/25', (avg_cost * 0.99)::numeric(10,2),
        '12/25', avg_cost
    ),
    total_deliveries = 390,
    successful_deliveries = floor(390 * success_rate)::INTEGER,
    failed_deliveries = floor(390 * (1 - success_rate) * 0.7)::INTEGER,
    delayed_deliveries = floor(390 * (1 - success_rate) * 0.3)::INTEGER
WHERE name = 'DHL';

-- Recalculate totals to match exactly
UPDATE "Carrier"
SET total_deliveries = successful_deliveries + failed_deliveries + delayed_deliveries;

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
