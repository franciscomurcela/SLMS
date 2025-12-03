-- Update carriers with realistic, non-randomized data
-- This sets fixed historical data and consistent metrics

-- FedEx: Premium service, higher cost, excellent reliability
UPDATE "Carrier"
SET 
    cost_history = jsonb_build_object(
        '06/25', 13.80,
        '07/25', 14.00,
        '08/25', 14.10,
        '09/25', 14.25,
        '10/25', 14.40,
        '11/25', 14.45,
        '12/25', 14.50
    ),
    total_deliveries = 450,
    successful_deliveries = 420,
    failed_deliveries = 10,
    delayed_deliveries = 20,
    avg_cost = 14.50,
    success_rate = 0.93,
    on_time_rate = 0.98
WHERE name = 'FedEx';

-- UPS: Mid-tier pricing, good reliability
UPDATE "Carrier"
SET 
    cost_history = jsonb_build_object(
        '06/25', 12.20,
        '07/25', 12.35,
        '08/25', 12.50,
        '09/25', 12.60,
        '10/25', 12.70,
        '11/25', 12.75,
        '12/25', 12.80
    ),
    total_deliveries = 520,
    successful_deliveries = 475,
    failed_deliveries = 15,
    delayed_deliveries = 30,
    avg_cost = 12.80,
    success_rate = 0.91,
    on_time_rate = 0.97
WHERE name = 'UPS';

-- DPD: Budget option, lower reliability
UPDATE "Carrier"
SET 
    cost_history = jsonb_build_object(
        '06/25', 9.50,
        '07/25', 9.70,
        '08/25', 9.85,
        '09/25', 9.95,
        '10/25', 10.05,
        '11/25', 10.15,
        '12/25', 10.20
    ),
    total_deliveries = 380,
    successful_deliveries = 310,
    failed_deliveries = 35,
    delayed_deliveries = 35,
    avg_cost = 10.20,
    success_rate = 0.82,
    on_time_rate = 0.91
WHERE name = 'DPD';

-- DHL: International focus, premium pricing, very reliable
UPDATE "Carrier"
SET 
    cost_history = jsonb_build_object(
        '06/25', 13.00,
        '07/25', 13.15,
        '08/25', 13.30,
        '09/25', 13.45,
        '10/25', 13.60,
        '11/25', 13.65,
        '12/25', 13.70
    ),
    total_deliveries = 410,
    successful_deliveries = 385,
    failed_deliveries = 8,
    delayed_deliveries = 17,
    avg_cost = 13.70,
    success_rate = 0.94,
    on_time_rate = 0.98
WHERE name = 'DHL';

-- Verify data integrity
SELECT 
    name,
    avg_cost,
    success_rate,
    on_time_rate,
    total_deliveries,
    successful_deliveries,
    failed_deliveries,
    delayed_deliveries,
    (successful_deliveries + failed_deliveries + delayed_deliveries) as calculated_total
FROM "Carrier"
ORDER BY name;
