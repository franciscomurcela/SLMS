-- ============================================
-- SLMS Database Schema (PostgreSQL)
-- Clean version without Supabase dependencies
-- ============================================

-- Drop existing tables if they exist
DROP TABLE IF EXISTS "Orders" CASCADE;
DROP TABLE IF EXISTS "Shipments" CASCADE;
DROP TABLE IF EXISTS "Driver" CASCADE;
DROP TABLE IF EXISTS "Carrier" CASCADE;
DROP TABLE IF EXISTS "Costumer" CASCADE;
DROP TABLE IF EXISTS "Csr" CASCADE;
DROP TABLE IF EXISTS "LogisticsManager" CASCADE;
DROP TABLE IF EXISTS "WarehouseStaff" CASCADE;
DROP TABLE IF EXISTS "Users" CASCADE;

-- ============================================
-- USERS TABLE (Main user table)
-- ============================================
CREATE TABLE "Users" (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text,
    email text,
    keycloak_id uuid,
    last_login timestamp with time zone DEFAULT now(),
    first_name text,
    last_name text,
    CONSTRAINT users_keycloak_id_key UNIQUE (keycloak_id),
    CONSTRAINT users_name_key UNIQUE (name)
);

-- ============================================
-- CARRIER TABLE
-- ============================================
CREATE TABLE "Carrier" (
    carrier_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    avg_cost numeric(10,2),
    on_time_rate numeric(5,2),
    success_rate numeric(5,2)
);

-- ============================================
-- DRIVER TABLE
-- ============================================
CREATE TABLE "Driver" (
    driver_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES "Users"(id) ON DELETE CASCADE,
    carrier_id uuid REFERENCES "Carrier"(carrier_id) ON DELETE SET NULL
);

-- ============================================
-- CUSTOMER TABLE
-- ============================================
CREATE TABLE "Costumer" (
    user_id uuid PRIMARY KEY REFERENCES "Users"(id) ON DELETE CASCADE,
    phone text
);

-- ============================================
-- CSR TABLE (Customer Service Representative)
-- ============================================
CREATE TABLE "Csr" (
    user_id uuid PRIMARY KEY REFERENCES "Users"(id) ON DELETE CASCADE
);

-- ============================================
-- LOGISTICS MANAGER TABLE
-- ============================================
CREATE TABLE "LogisticsManager" (
    user_id uuid PRIMARY KEY REFERENCES "Users"(id) ON DELETE CASCADE
);

-- ============================================
-- WAREHOUSE STAFF TABLE
-- ============================================
CREATE TABLE "WarehouseStaff" (
    user_id uuid PRIMARY KEY REFERENCES "Users"(id) ON DELETE CASCADE
);

-- ============================================
-- SHIPMENTS TABLE
-- ============================================
CREATE TABLE "Shipments" (
    shipment_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    carrier_id uuid REFERENCES "Carrier"(carrier_id) ON DELETE SET NULL,
    driver_id uuid REFERENCES "Driver"(driver_id) ON DELETE SET NULL,
    departure_time timestamp with time zone,
    arrival_time timestamp with time zone,
    status text CHECK (status IN ('Pending', 'InTransit', 'Delivered', 'Cancelled'))
);

-- ============================================
-- ORDERS TABLE
-- ============================================
CREATE TABLE "Orders" (
    order_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    costumer_id uuid REFERENCES "Costumer"(user_id) ON DELETE SET NULL,
    shipment_id uuid REFERENCES "Shipments"(shipment_id) ON DELETE SET NULL,
    carrier_id uuid REFERENCES "Carrier"(carrier_id) ON DELETE SET NULL,
    order_date timestamp with time zone DEFAULT now(),
    origin_address text NOT NULL,
    destination_address text NOT NULL,
    weight numeric(10,2),
    tracking_id text,
    actual_delivery_time timestamp with time zone,
    pod bytea,
    status text CHECK (status IN ('Pending', 'Assigned', 'InTransit', 'Delivered', 'Cancelled'))
);

-- ============================================
-- INDEXES for performance
-- ============================================
CREATE INDEX idx_users_keycloak_id ON "Users"(keycloak_id);
CREATE INDEX idx_users_name ON "Users"(name);
CREATE INDEX idx_driver_user_id ON "Driver"(user_id);
CREATE INDEX idx_driver_carrier_id ON "Driver"(carrier_id);
CREATE INDEX idx_orders_costumer_id ON "Orders"(costumer_id);
CREATE INDEX idx_orders_carrier_id ON "Orders"(carrier_id);
CREATE INDEX idx_orders_shipment_id ON "Orders"(shipment_id);
CREATE INDEX idx_shipments_carrier_id ON "Shipments"(carrier_id);
CREATE INDEX idx_shipments_driver_id ON "Shipments"(driver_id);
CREATE INDEX idx_shipments_status ON "Shipments"(status);
CREATE INDEX idx_orders_status ON "Orders"(status);

COMMENT ON TABLE "Users" IS 'Main user table synced from Keycloak';
COMMENT ON TABLE "Carrier" IS 'Shipping carriers/companies';
COMMENT ON TABLE "Driver" IS 'Drivers assigned to carriers';
COMMENT ON TABLE "Costumer" IS 'Customer users';
COMMENT ON TABLE "Csr" IS 'Customer Service Representatives';
COMMENT ON TABLE "LogisticsManager" IS 'Logistics Managers';
COMMENT ON TABLE "WarehouseStaff" IS 'Warehouse Staff';
COMMENT ON TABLE "Shipments" IS 'Shipment tracking';
COMMENT ON TABLE "Orders" IS 'Customer orders';
