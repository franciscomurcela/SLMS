-- ============================================
-- Migration 007: Enhance Carrier Metrics
-- ============================================
-- Adds detailed delivery metrics and cost history to Carrier table
-- This enables better logistics optimization and trend analysis

-- Add new columns for detailed metrics
ALTER TABLE "Carrier" 
ADD COLUMN IF NOT EXISTS cost_history JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS successful_deliveries INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS failed_deliveries INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS delayed_deliveries INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_deliveries INTEGER DEFAULT 0;

-- Add comments for documentation
COMMENT ON COLUMN "Carrier".cost_history IS 'Historical cost data by month/year (e.g., {"12/25": 14.5, "11/25": 14.2})';
COMMENT ON COLUMN "Carrier".successful_deliveries IS 'Number of deliveries completed successfully and on time';
COMMENT ON COLUMN "Carrier".failed_deliveries IS 'Number of deliveries with errors or failures';
COMMENT ON COLUMN "Carrier".delayed_deliveries IS 'Number of deliveries completed but past expected time';
COMMENT ON COLUMN "Carrier".total_deliveries IS 'Total number of deliveries attempted';

-- Update existing carriers with sample historical data
-- This populates realistic trends for the last 6 months

UPDATE "Carrier"
SET 
    cost_history = jsonb_build_object(
        '06/25', (avg_cost * (0.90 + random() * 0.10))::numeric(10,2),
        '07/25', (avg_cost * (0.92 + random() * 0.08))::numeric(10,2),
        '08/25', (avg_cost * (0.94 + random() * 0.06))::numeric(10,2),
        '09/25', (avg_cost * (0.95 + random() * 0.05))::numeric(10,2),
        '10/25', (avg_cost * (0.97 + random() * 0.03))::numeric(10,2),
        '11/25', (avg_cost * (0.98 + random() * 0.02))::numeric(10,2),
        '12/25', avg_cost
    ),
    total_deliveries = (100 + floor(random() * 400))::INTEGER
WHERE avg_cost IS NOT NULL;

-- Calculate successful deliveries based on success_rate
UPDATE "Carrier"
SET successful_deliveries = CASE 
    WHEN success_rate IS NOT NULL AND total_deliveries > 0 THEN 
        floor(success_rate * total_deliveries)::INTEGER
    ELSE 
        floor(0.90 * total_deliveries)::INTEGER
END
WHERE total_deliveries > 0;

-- Calculate delayed deliveries based on on_time_rate
UPDATE "Carrier"
SET delayed_deliveries = CASE
    WHEN on_time_rate IS NOT NULL AND total_deliveries > 0 THEN
        floor((1 - on_time_rate) * successful_deliveries * 0.8)::INTEGER
    ELSE
        floor(0.05 * total_deliveries)::INTEGER
END
WHERE total_deliveries > 0;

-- Calculate failed deliveries (remaining after successful)
UPDATE "Carrier"
SET failed_deliveries = GREATEST(0, total_deliveries - successful_deliveries - delayed_deliveries)
WHERE total_deliveries > 0;

-- Recalculate rates based on actual numbers for consistency
UPDATE "Carrier"
SET 
    success_rate = CASE 
        WHEN total_deliveries > 0 THEN 
            ROUND((successful_deliveries::numeric / total_deliveries::numeric), 2)
        ELSE 
            success_rate
    END,
    on_time_rate = CASE
        WHEN total_deliveries > 0 THEN
            ROUND(((successful_deliveries::numeric + delayed_deliveries::numeric) / total_deliveries::numeric), 2)
        ELSE
            on_time_rate
    END
WHERE total_deliveries > 0;

-- Create index on cost_history for faster JSONB queries
CREATE INDEX IF NOT EXISTS idx_carrier_cost_history ON "Carrier" USING gin(cost_history);

-- Add constraint to ensure metrics consistency
ALTER TABLE "Carrier"
ADD CONSTRAINT chk_carrier_metrics_consistency 
CHECK (
    total_deliveries >= 0 AND
    successful_deliveries >= 0 AND
    failed_deliveries >= 0 AND
    delayed_deliveries >= 0 AND
    (successful_deliveries + failed_deliveries) <= total_deliveries
);

COMMENT ON CONSTRAINT chk_carrier_metrics_consistency ON "Carrier" 
IS 'Ensures delivery counts are non-negative and successful+failed do not exceed total';
