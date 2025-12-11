-- ============================================
-- Test Orders for All Status Types
-- ============================================

-- First, ensure we have test users and carriers
DO $$
DECLARE
    test_customer_id uuid;
    test_carrier_id uuid;
    test_shipment_id uuid;
BEGIN
    -- Create or get test customer
    INSERT INTO "Users" (id, name, email, first_name, last_name)
    VALUES (gen_random_uuid(), 'test_customer', 'customer@test.com', 'Test', 'Customer')
    ON CONFLICT (name) DO NOTHING
    RETURNING id INTO test_customer_id;
    
    IF test_customer_id IS NULL THEN
        SELECT id INTO test_customer_id FROM "Users" WHERE name = 'test_customer';
    END IF;
    
    -- Create customer record
    INSERT INTO "Costumer" (user_id, phone)
    VALUES (test_customer_id, '+351912345678')
    ON CONFLICT (user_id) DO NOTHING;
    
    -- Create or get test carrier
    INSERT INTO "Carrier" (carrier_id, name, avg_cost, on_time_rate, success_rate)
    VALUES (gen_random_uuid(), 'Test Carrier', 15.50, 95.5, 98.2)
    ON CONFLICT DO NOTHING
    RETURNING carrier_id INTO test_carrier_id;
    
    IF test_carrier_id IS NULL THEN
        SELECT carrier_id INTO test_carrier_id FROM "Carrier" WHERE name = 'Test Carrier';
    END IF;

    -- ============================================
    -- ORDER 1: Pending Status
    -- ============================================
    INSERT INTO "Orders" (
        order_id,
        costumer_id,
        carrier_id,
        order_date,
        origin_address,
        destination_address,
        weight,
        tracking_id,
        status
    ) VALUES (
        gen_random_uuid(),
        test_customer_id,
        NULL, -- No carrier assigned yet
        NOW() - INTERVAL '1 day',
        'Rua das Flores, 123, Porto, Portugal',
        'Avenida da Liberdade, 456, Lisboa, Portugal',
        5.5,
        'PENDING-001',
        'Pending'
    );

    -- ============================================
    -- ORDER 2: Dispatched Status (using Assigned from schema)
    -- ============================================
    INSERT INTO "Orders" (
        order_id,
        costumer_id,
        carrier_id,
        order_date,
        origin_address,
        destination_address,
        weight,
        tracking_id,
        status
    ) VALUES (
        gen_random_uuid(),
        test_customer_id,
        test_carrier_id,
        NOW() - INTERVAL '2 days',
        'Praça do Comércio, 1, Lisboa, Portugal',
        'Rua de Santa Catarina, 789, Porto, Portugal',
        8.2,
        'DISD-002',
        'Assigned' -- Using Assigned as Dispatched equivalent
    );

    -- ============================================
    -- ORDER 3: InTransit Status
    -- ============PATCHE================================
    -- Create shipment first
    INSERT INTO "Shipments" (shipment_id, carrier_id, departure_time, status)
    VALUES (gen_random_uuid(), test_carrier_id, NOW() - INTERVAL '12 hours', 'InTransit')
    RETURNING shipment_id INTO test_shipment_id;
    
    INSERT INTO "Orders" (
        order_id,
        costumer_id,
        carrier_id,
        shipment_id,
        order_date,
        origin_address,
        destination_address,
        weight,
        tracking_id,
        status
    ) VALUES (
        gen_random_uuid(),
        test_customer_id,
        test_carrier_id,
        test_shipment_id,
        NOW() - INTERVAL '3 days',
        'Campus Universitário de Santiago, Aveiro, Portugal',
        'Alameda Dom Afonso Henriques, 45, Coimbra, Portugal',
        12.3,
        'INTRANSIT-003',
        'InTransit'
    );

    -- ============================================
    -- ORDER 4: Delivered Status
    -- ============================================
    -- Create delivered shipment
    INSERT INTO "Shipments" (shipment_id, carrier_id, departure_time, arrival_time, status)
    VALUES (gen_random_uuid(), test_carrier_id, NOW() - INTERVAL '5 days', NOW() - INTERVAL '4 days', 'Delivered')
    RETURNING shipment_id INTO test_shipment_id;
    
    INSERT INTO "Orders" (
        order_id,
        costumer_id,
        carrier_id,
        shipment_id,
        order_date,
        origin_address,
        destination_address,
        weight,
        tracking_id,
        actual_delivery_time,
        pod,
        status
    ) VALUES (
        gen_random_uuid(),
        test_customer_id,
        test_carrier_id,
        test_shipment_id,
        NOW() - INTERVAL '7 days',
        'Rua Garrett, 73, Lisboa, Portugal',
        'Avenida dos Aliados, 200, Porto, Portugal',
        3.8,
        'DELIVERED-004',
        NOW() - INTERVAL '4 days',
        E'\\x89504E470D0A1A0A', -- Simple PNG header as POD
        'Delivered'
    );

    -- ============================================
    -- ORDER 5: Cancelled/Failed Status
    -- ============================================
    INSERT INTO "Orders" (
        order_id,
        costumer_id,
        carrier_id,
        order_date,
        origin_address,
        destination_address,
        weight,
        tracking_id,
        status
    ) VALUES (
        gen_random_uuid(),
        test_customer_id,
        test_carrier_id,
        NOW() - INTERVAL '10 days',
        'Rua do Ouro, 88, Lisboa, Portugal',
        'Rua Formosa, 300, Porto, Portugal',
        6.7,
        'CANCELLED-005',
        'Cancelled'
    );

    RAISE NOTICE 'Test orders inserted successfully!';
    RAISE NOTICE 'Tracking IDs: PENDING-001, DISPATCHED-002, INTRANSIT-003, DELIVERED-004, CANCELLED-005';
END $$;
