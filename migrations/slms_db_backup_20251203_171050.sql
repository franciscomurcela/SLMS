--
-- PostgreSQL database dump
--

\restrict BZ8M0UlpWwk8TUqJeyriXzZWfbcLH4IVJjOeW8762wwWfc4TXF6CTc548FENlbz

-- Dumped from database version 15.14
-- Dumped by pg_dump version 15.14

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

ALTER TABLE IF EXISTS ONLY public."WarehouseStaff" DROP CONSTRAINT IF EXISTS "WarehouseStaff_user_id_fkey";
ALTER TABLE IF EXISTS ONLY public."Shipments" DROP CONSTRAINT IF EXISTS "Shipments_driver_id_fkey";
ALTER TABLE IF EXISTS ONLY public."Shipments" DROP CONSTRAINT IF EXISTS "Shipments_carrier_id_fkey";
ALTER TABLE IF EXISTS ONLY public."Orders" DROP CONSTRAINT IF EXISTS "Orders_shipment_id_fkey";
ALTER TABLE IF EXISTS ONLY public."Orders" DROP CONSTRAINT IF EXISTS "Orders_costumer_id_fkey";
ALTER TABLE IF EXISTS ONLY public."Orders" DROP CONSTRAINT IF EXISTS "Orders_carrier_id_fkey";
ALTER TABLE IF EXISTS ONLY public."Notifications" DROP CONSTRAINT IF EXISTS "Notifications_user_id_fkey";
ALTER TABLE IF EXISTS ONLY public."LogisticsManager" DROP CONSTRAINT IF EXISTS "LogisticsManager_user_id_fkey";
ALTER TABLE IF EXISTS ONLY public."Driver" DROP CONSTRAINT IF EXISTS "Driver_user_id_fkey";
ALTER TABLE IF EXISTS ONLY public."Driver" DROP CONSTRAINT IF EXISTS "Driver_carrier_id_fkey";
ALTER TABLE IF EXISTS ONLY public."Csr" DROP CONSTRAINT IF EXISTS "Csr_user_id_fkey";
ALTER TABLE IF EXISTS ONLY public."Costumer" DROP CONSTRAINT IF EXISTS "Costumer_user_id_fkey";
DROP INDEX IF EXISTS public.idx_users_name;
DROP INDEX IF EXISTS public.idx_users_keycloak_id;
DROP INDEX IF EXISTS public.idx_shipments_status;
DROP INDEX IF EXISTS public.idx_shipments_driver_id;
DROP INDEX IF EXISTS public.idx_shipments_carrier_id;
DROP INDEX IF EXISTS public.idx_orders_status;
DROP INDEX IF EXISTS public.idx_orders_shipment_id;
DROP INDEX IF EXISTS public.idx_orders_costumer_id;
DROP INDEX IF EXISTS public.idx_orders_carrier_id;
DROP INDEX IF EXISTS public.idx_notifications_user_unread;
DROP INDEX IF EXISTS public.idx_notifications_user_id;
DROP INDEX IF EXISTS public.idx_notifications_is_read;
DROP INDEX IF EXISTS public.idx_notifications_created_at;
DROP INDEX IF EXISTS public.idx_driver_user_id;
DROP INDEX IF EXISTS public.idx_driver_carrier_id;
DROP INDEX IF EXISTS public.idx_carrier_cost_history;
ALTER TABLE IF EXISTS ONLY public."Users" DROP CONSTRAINT IF EXISTS users_name_key;
ALTER TABLE IF EXISTS ONLY public."Users" DROP CONSTRAINT IF EXISTS users_keycloak_id_key;
ALTER TABLE IF EXISTS ONLY public."WarehouseStaff" DROP CONSTRAINT IF EXISTS "WarehouseStaff_pkey";
ALTER TABLE IF EXISTS ONLY public."Users" DROP CONSTRAINT IF EXISTS "Users_pkey";
ALTER TABLE IF EXISTS ONLY public."Shipments" DROP CONSTRAINT IF EXISTS "Shipments_pkey";
ALTER TABLE IF EXISTS ONLY public."Orders" DROP CONSTRAINT IF EXISTS "Orders_pkey";
ALTER TABLE IF EXISTS ONLY public."Notifications" DROP CONSTRAINT IF EXISTS "Notifications_pkey";
ALTER TABLE IF EXISTS ONLY public."LogisticsManager" DROP CONSTRAINT IF EXISTS "LogisticsManager_pkey";
ALTER TABLE IF EXISTS ONLY public."Driver" DROP CONSTRAINT IF EXISTS "Driver_pkey";
ALTER TABLE IF EXISTS ONLY public."Csr" DROP CONSTRAINT IF EXISTS "Csr_pkey";
ALTER TABLE IF EXISTS ONLY public."Costumer" DROP CONSTRAINT IF EXISTS "Costumer_pkey";
ALTER TABLE IF EXISTS ONLY public."Carrier" DROP CONSTRAINT IF EXISTS "Carrier_pkey";
ALTER TABLE IF EXISTS public."Notifications" ALTER COLUMN id DROP DEFAULT;
DROP TABLE IF EXISTS public."WarehouseStaff";
DROP TABLE IF EXISTS public."Users";
DROP TABLE IF EXISTS public."Shipments";
DROP TABLE IF EXISTS public."Orders";
DROP SEQUENCE IF EXISTS public."Notifications_id_seq";
DROP TABLE IF EXISTS public."Notifications";
DROP TABLE IF EXISTS public."LogisticsManager";
DROP TABLE IF EXISTS public."Driver";
DROP TABLE IF EXISTS public."Csr";
DROP TABLE IF EXISTS public."Costumer";
DROP TABLE IF EXISTS public."Carrier";
-- *not* dropping schema, since initdb creates it
--
-- Name: public; Type: SCHEMA; Schema: -; Owner: slms_user
--

-- *not* creating schema, since initdb creates it


ALTER SCHEMA public OWNER TO slms_user;

--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: slms_user
--

COMMENT ON SCHEMA public IS '';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: Carrier; Type: TABLE; Schema: public; Owner: slms_user
--

CREATE TABLE public."Carrier" (
    carrier_id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    avg_cost numeric(10,2),
    on_time_rate numeric(5,2),
    success_rate numeric(5,2),
    cost_history jsonb DEFAULT '{}'::jsonb,
    successful_deliveries integer DEFAULT 0,
    failed_deliveries integer DEFAULT 0,
    delayed_deliveries integer DEFAULT 0,
    total_deliveries integer DEFAULT 0,
    CONSTRAINT chk_carrier_metrics_consistency CHECK (((total_deliveries >= 0) AND (successful_deliveries >= 0) AND (failed_deliveries >= 0) AND (delayed_deliveries >= 0) AND (total_deliveries = ((successful_deliveries + failed_deliveries) + delayed_deliveries))))
);


ALTER TABLE public."Carrier" OWNER TO slms_user;

--
-- Name: TABLE "Carrier"; Type: COMMENT; Schema: public; Owner: slms_user
--

COMMENT ON TABLE public."Carrier" IS 'Shipping carriers/companies';


--
-- Name: COLUMN "Carrier".cost_history; Type: COMMENT; Schema: public; Owner: slms_user
--

COMMENT ON COLUMN public."Carrier".cost_history IS 'Historical cost data by month/year (e.g., {"12/25": 14.5, "11/25": 14.2})';


--
-- Name: COLUMN "Carrier".successful_deliveries; Type: COMMENT; Schema: public; Owner: slms_user
--

COMMENT ON COLUMN public."Carrier".successful_deliveries IS 'Number of deliveries completed successfully and on time';


--
-- Name: COLUMN "Carrier".failed_deliveries; Type: COMMENT; Schema: public; Owner: slms_user
--

COMMENT ON COLUMN public."Carrier".failed_deliveries IS 'Number of deliveries with errors or failures';


--
-- Name: COLUMN "Carrier".delayed_deliveries; Type: COMMENT; Schema: public; Owner: slms_user
--

COMMENT ON COLUMN public."Carrier".delayed_deliveries IS 'Number of deliveries completed but past expected time';


--
-- Name: COLUMN "Carrier".total_deliveries; Type: COMMENT; Schema: public; Owner: slms_user
--

COMMENT ON COLUMN public."Carrier".total_deliveries IS 'Total number of deliveries attempted';


--
-- Name: Costumer; Type: TABLE; Schema: public; Owner: slms_user
--

CREATE TABLE public."Costumer" (
    user_id uuid NOT NULL,
    phone text
);


ALTER TABLE public."Costumer" OWNER TO slms_user;

--
-- Name: TABLE "Costumer"; Type: COMMENT; Schema: public; Owner: slms_user
--

COMMENT ON TABLE public."Costumer" IS 'Customer users';


--
-- Name: Csr; Type: TABLE; Schema: public; Owner: slms_user
--

CREATE TABLE public."Csr" (
    user_id uuid NOT NULL
);


ALTER TABLE public."Csr" OWNER TO slms_user;

--
-- Name: TABLE "Csr"; Type: COMMENT; Schema: public; Owner: slms_user
--

COMMENT ON TABLE public."Csr" IS 'Customer Service Representatives';


--
-- Name: Driver; Type: TABLE; Schema: public; Owner: slms_user
--

CREATE TABLE public."Driver" (
    driver_id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    carrier_id uuid
);


ALTER TABLE public."Driver" OWNER TO slms_user;

--
-- Name: TABLE "Driver"; Type: COMMENT; Schema: public; Owner: slms_user
--

COMMENT ON TABLE public."Driver" IS 'Drivers assigned to carriers';


--
-- Name: LogisticsManager; Type: TABLE; Schema: public; Owner: slms_user
--

CREATE TABLE public."LogisticsManager" (
    user_id uuid NOT NULL
);


ALTER TABLE public."LogisticsManager" OWNER TO slms_user;

--
-- Name: TABLE "LogisticsManager"; Type: COMMENT; Schema: public; Owner: slms_user
--

COMMENT ON TABLE public."LogisticsManager" IS 'Logistics Managers';


--
-- Name: Notifications; Type: TABLE; Schema: public; Owner: slms_user
--

CREATE TABLE public."Notifications" (
    id bigint NOT NULL,
    user_id uuid NOT NULL,
    type character varying(50) NOT NULL,
    title character varying(255) NOT NULL,
    message text NOT NULL,
    related_entity_type character varying(50),
    related_entity_id uuid,
    severity character varying(20) DEFAULT 'INFO'::character varying,
    is_read boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    read_at timestamp with time zone,
    metadata jsonb DEFAULT '{}'::jsonb
);


ALTER TABLE public."Notifications" OWNER TO slms_user;

--
-- Name: TABLE "Notifications"; Type: COMMENT; Schema: public; Owner: slms_user
--

COMMENT ON TABLE public."Notifications" IS 'Notifications for users about system events';

--
-- Name: Notifications_id_seq; Type: SEQUENCE; Schema: public; Owner: slms_user
--

CREATE SEQUENCE public."Notifications_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public."Notifications_id_seq" OWNER TO slms_user;

--
-- Name: Notifications_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: slms_user
--

ALTER SEQUENCE public."Notifications_id_seq" OWNED BY public."Notifications".id;


--
-- Name: Orders; Type: TABLE; Schema: public; Owner: slms_user
--

CREATE TABLE public."Orders" (
    order_id uuid DEFAULT gen_random_uuid() NOT NULL,
    costumer_id uuid,
    shipment_id uuid,
    carrier_id uuid,
    order_date timestamp with time zone DEFAULT now(),
    origin_address text NOT NULL,
    destination_address text NOT NULL,
    weight numeric(10,2),
    tracking_id text,
    actual_delivery_time timestamp with time zone,
    pod bytea,
    status text,
    error_message text
);


ALTER TABLE public."Orders" OWNER TO slms_user;

--
-- Name: TABLE "Orders"; Type: COMMENT; Schema: public; Owner: slms_user
--

COMMENT ON TABLE public."Orders" IS 'Customer orders';


--
-- Name: Shipments; Type: TABLE; Schema: public; Owner: slms_user
--

CREATE TABLE public."Shipments" (
    shipment_id uuid DEFAULT gen_random_uuid() NOT NULL,
    carrier_id uuid,
    driver_id uuid,
    departure_time timestamp with time zone,
    arrival_time timestamp with time zone,
    status text,
    CONSTRAINT "Shipments_status_check" CHECK ((status = ANY (ARRAY['Pending'::text, 'InTransit'::text, 'Delivered'::text, 'Cancelled'::text])))
);


ALTER TABLE public."Shipments" OWNER TO slms_user;

--
-- Name: TABLE "Shipments"; Type: COMMENT; Schema: public; Owner: slms_user
--

COMMENT ON TABLE public."Shipments" IS 'Shipment tracking';


--
-- Name: Users; Type: TABLE; Schema: public; Owner: slms_user
--

CREATE TABLE public."Users" (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text,
    email text,
    keycloak_id uuid,
    last_login timestamp with time zone DEFAULT now(),
    first_name text,
    last_name text
);


ALTER TABLE public."Users" OWNER TO slms_user;

--
-- Name: TABLE "Users"; Type: COMMENT; Schema: public; Owner: slms_user
--

COMMENT ON TABLE public."Users" IS 'Main user table synced from Keycloak';


--
-- Name: WarehouseStaff; Type: TABLE; Schema: public; Owner: slms_user
--

CREATE TABLE public."WarehouseStaff" (
    user_id uuid NOT NULL
);


ALTER TABLE public."WarehouseStaff" OWNER TO slms_user;

--
-- Name: TABLE "WarehouseStaff"; Type: COMMENT; Schema: public; Owner: slms_user
--

COMMENT ON TABLE public."WarehouseStaff" IS 'Warehouse Staff';


--
-- Name: Notifications id; Type: DEFAULT; Schema: public; Owner: slms_user
--

ALTER TABLE ONLY public."Notifications" ALTER COLUMN id SET DEFAULT nextval('public."Notifications_id_seq"'::regclass);


--
-- Data for Name: Carrier; Type: TABLE DATA; Schema: public; Owner: slms_user
--

INSERT INTO public."Carrier" (carrier_id, name, avg_cost, on_time_rate, success_rate, cost_history, successful_deliveries, failed_deliveries, delayed_deliveries, total_deliveries) VALUES ('193c9b19-b485-4bd3-bf9c-7414f2bde2b3', 'DPD', 10.20, 0.91, 0.82, '{"06/25": 10.20, "07/25": 10.50, "08/25": 10.80, "09/25": 10.40, "10/25": 10.90, "11/25": 10.60, "12/25": 10.20}', 310, 35, 35, 380);
INSERT INTO public."Carrier" (carrier_id, name, avg_cost, on_time_rate, success_rate, cost_history, successful_deliveries, failed_deliveries, delayed_deliveries, total_deliveries) VALUES ('035e3667-66e1-4f90-abf8-e45caab9b1f2', 'FedEx', 14.50, 0.98, 0.93, '{"06/25": 13.80, "07/25": 14.20, "08/25": 13.95, "09/25": 14.50, "10/25": 14.35, "11/25": 14.85, "12/25": 15.20}', 420, 10, 20, 450);
INSERT INTO public."Carrier" (carrier_id, name, avg_cost, on_time_rate, success_rate, cost_history, successful_deliveries, failed_deliveries, delayed_deliveries, total_deliveries) VALUES ('a56c5b31-b805-4144-95ce-173c3ad23c8e', 'UPS', 12.80, 0.97, 0.91, '{"06/25": 12.80, "07/25": 13.20, "08/25": 12.95, "09/25": 13.10, "10/25": 12.70, "11/25": 13.80, "12/25": 14.20}', 475, 15, 30, 520);
INSERT INTO public."Carrier" (carrier_id, name, avg_cost, on_time_rate, success_rate, cost_history, successful_deliveries, failed_deliveries, delayed_deliveries, total_deliveries) VALUES ('c0d95338-90df-4926-810d-be518c8a5e53', 'DHL', 13.70, 0.98, 0.94, '{"06/25": 13.70, "07/25": 13.50, "08/25": 13.90, "09/25": 14.10, "10/25": 13.80, "11/25": 13.50, "12/25": 13.30}', 385, 8, 17, 410);


--
-- Data for Name: Costumer; Type: TABLE DATA; Schema: public; Owner: slms_user
--

INSERT INTO public."Costumer" (user_id, phone) VALUES ('b03981b3-c6d6-4d20-9a4c-93d7a4b9ce86', '15');
INSERT INTO public."Costumer" (user_id, phone) VALUES ('79b311db-909b-4513-be09-0b7185c89fe2', '15');
INSERT INTO public."Costumer" (user_id, phone) VALUES ('503d3e04-6815-4608-afa4-3f4b30c31adf', '15');
INSERT INTO public."Costumer" (user_id, phone) VALUES ('5191d06f-e840-43c6-9548-1ec0136e1224', '15');


--
-- Data for Name: Csr; Type: TABLE DATA; Schema: public; Owner: slms_user
--

INSERT INTO public."Csr" (user_id) VALUES ('7ded4be4-40d1-48ae-9247-6f20f672cf09');


--
-- Data for Name: Driver; Type: TABLE DATA; Schema: public; Owner: slms_user
--

INSERT INTO public."Driver" (driver_id, user_id, carrier_id) VALUES ('0165cc88-6569-409d-b81f-e7ae473c0fa1', '15594613-166d-4dab-ac19-6dff958374d0', '035e3667-66e1-4f90-abf8-e45caab9b1f2');
INSERT INTO public."Driver" (driver_id, user_id, carrier_id) VALUES ('fb81680d-e588-448a-8d2d-8bfae5148560', 'b8188bf4-84c8-4a38-8a23-0269c2ed755c', 'a56c5b31-b805-4144-95ce-173c3ad23c8e');
INSERT INTO public."Driver" (driver_id, user_id, carrier_id) VALUES ('31d122fb-5b2e-442f-ae1e-80294df19db3', '213c0529-04a1-453e-8d4c-d903471ae4e8', 'c0d95338-90df-4926-810d-be518c8a5e53');


--
-- Data for Name: LogisticsManager; Type: TABLE DATA; Schema: public; Owner: slms_user
--

INSERT INTO public."LogisticsManager" (user_id) VALUES ('bab4f237-718e-4fd3-82e1-6451b2ac8c2b');


--
-- Data for Name: Notifications; Type: TABLE DATA; Schema: public; Owner: slms_user
--



--
-- Data for Name: Orders; Type: TABLE DATA; Schema: public; Owner: slms_user
--

INSERT INTO public."Orders" (order_id, costumer_id, shipment_id, carrier_id, order_date, origin_address, destination_address, weight, tracking_id, actual_delivery_time, pod, status, error_message) VALUES ('3e60fddd-8836-422a-985d-6a623728347c', '5191d06f-e840-43c6-9548-1ec0136e1224', 'b1ca0b16-f414-47fa-ae8b-49c8616049c1', 'a56c5b31-b805-4144-95ce-173c3ad23c8e', '2025-10-15 12:40:04+00', 'Rua das Flores, 120', 'Av. Atl??ntica, 1500', 30.20, '9315a70a-ae2e-4a64-8d67-07508155500d', NULL, NULL, 'InTransit', NULL);
INSERT INTO public."Orders" (order_id, costumer_id, shipment_id, carrier_id, order_date, origin_address, destination_address, weight, tracking_id, actual_delivery_time, pod, status, error_message) VALUES ('928c5da4-5e83-4544-bdf3-d204c47f172e', '5191d06f-e840-43c6-9548-1ec0136e1224', 'b1ca0b16-f414-47fa-ae8b-49c8616049c1', 'a56c5b31-b805-4144-95ce-173c3ad23c8e', '2025-10-15 12:38:22+00', 'Rua das Flores, 120', 'Rua S??o Bento, 77', 5.20, '039e0cfa-a791-416f-bfc9-dece9c6c5068', NULL, NULL, 'InTransit', NULL);
INSERT INTO public."Orders" (order_id, costumer_id, shipment_id, carrier_id, order_date, origin_address, destination_address, weight, tracking_id, actual_delivery_time, pod, status, error_message) VALUES ('3d88f621-9667-4da9-8920-f85f21907195', '79b311db-909b-4513-be09-0b7185c89fe2', 'b2319ba9-7137-4610-813c-920ac55b2c5f', 'c0d95338-90df-4926-810d-be518c8a5e53', '2025-10-15 12:40:38+00', 'Rua das Flores, 120', 'Rua das Ac??cias, 145', 9.30, 'd0d1fdf3-5e2f-420f-87ac-0396833b0aca', NULL, NULL, 'InTransit', NULL);
INSERT INTO public."Orders" (order_id, costumer_id, shipment_id, carrier_id, order_date, origin_address, destination_address, weight, tracking_id, actual_delivery_time, pod, status, error_message) VALUES ('9e4418b9-625e-4396-a6fb-9d141b08debc', '503d3e04-6815-4608-afa4-3f4b30c31adf', '0d593066-a456-41e9-a90c-b89b1ac05640', 'c0d95338-90df-4926-810d-be518c8a5e53', '2025-10-15 12:31:22+00', 'Rua das Flores, 120', 'Av. Central, 500', 2.30, '71e7f15d-32c8-4643-ae82-07c7922c2f15', NULL, NULL, 'Pending', NULL);
INSERT INTO public."Orders" (order_id, costumer_id, shipment_id, carrier_id, order_date, origin_address, destination_address, weight, tracking_id, actual_delivery_time, pod, status, error_message) VALUES ('c1e9deb8-5a03-4b39-b081-f58405ad056b', '503d3e04-6815-4608-afa4-3f4b30c31adf', '0d593066-a456-41e9-a90c-b89b1ac05640', '035e3667-66e1-4f90-abf8-e45caab9b1f2', '2025-10-15 12:37:11+00', 'Rua das Flores, 210', 'Rua das Palmeiras, 210', 12.30, 'ae939af6-a572-4f88-9b51-3e253e288371', NULL, NULL, 'Pending', NULL);
INSERT INTO public."Orders" (order_id, costumer_id, shipment_id, carrier_id, order_date, origin_address, destination_address, weight, tracking_id, actual_delivery_time, pod, status, error_message) VALUES ('0c0d68ec-8da8-440a-a159-b9f71061e273', '503d3e04-6815-4608-afa4-3f4b30c31adf', '0d593066-a456-41e9-a90c-b89b1ac05640', NULL, '2025-10-15 12:38:12+00', 'Rua das Flores, 120', 'Rua das Palmeiras, 210', 23.20, 'c6d018e9-d265-4679-bc40-d42e5f6ed46b', NULL, NULL, 'Pending', '[FALHA DESPACHO] Endereço de origem inválido');


--
-- Data for Name: Shipments; Type: TABLE DATA; Schema: public; Owner: slms_user
--

INSERT INTO public."Shipments" (shipment_id, carrier_id, driver_id, departure_time, arrival_time, status) VALUES ('b1ca0b16-f414-47fa-ae8b-49c8616049c1', 'a56c5b31-b805-4144-95ce-173c3ad23c8e', 'fb81680d-e588-448a-8d2d-8bfae5148560', '2025-10-15 12:27:21+00', '2025-10-15 11:27:51.136221+00', 'InTransit');
INSERT INTO public."Shipments" (shipment_id, carrier_id, driver_id, departure_time, arrival_time, status) VALUES ('b2319ba9-7137-4610-813c-920ac55b2c5f', '193c9b19-b485-4bd3-bf9c-7414f2bde2b3', '0165cc88-6569-409d-b81f-e7ae473c0fa1', '2025-10-15 11:27:14.353847+00', '2025-10-15 11:27:14.353847+00', 'InTransit');
INSERT INTO public."Shipments" (shipment_id, carrier_id, driver_id, departure_time, arrival_time, status) VALUES ('0d593066-a456-41e9-a90c-b89b1ac05640', 'c0d95338-90df-4926-810d-be518c8a5e53', '31d122fb-5b2e-442f-ae1e-80294df19db3', NULL, NULL, 'Pending');


--
-- Data for Name: Users; Type: TABLE DATA; Schema: public; Owner: slms_user
--

INSERT INTO public."Users" (id, name, email, keycloak_id, last_login, first_name, last_name) VALUES ('bab4f237-718e-4fd3-82e1-6451b2ac8c2b', 'fabiofigueiredo', 'fabiofig@gmail.com', '0705b8aa-f064-45f3-ba03-10065db96c7c', '2025-10-15 00:52:37.043786+00', 'Fabio', 'Figueiredo');
INSERT INTO public."Users" (id, name, email, keycloak_id, last_login, first_name, last_name) VALUES ('f4ec55f9-2918-4b3a-a27c-f77a3e72fdb8', 'ricardocastro', 'ricastro@gmail.com', 'c2f523c8-0101-4f11-8335-462408e79ab4', '2025-10-15 00:53:12.323677+00', 'Ricardo', 'Castro');
INSERT INTO public."Users" (id, name, email, keycloak_id, last_login, first_name, last_name) VALUES ('b03981b3-c6d6-4d20-9a4c-93d7a4b9ce86', 'mikedias', 'mikedias@gmail.com', '0fa1c37d-894e-43f6-8bd4-b20f9fd110f9', '2025-10-15 00:53:19.624742+00', 'Miguel', 'Dias');
INSERT INTO public."Users" (id, name, email, keycloak_id, last_login, first_name, last_name) VALUES ('15594613-166d-4dab-ac19-6dff958374d0', 'marionunes', 'marionunes@gmail.com', 'dd675677-5eaf-45eb-9498-3ce2315ff129', '2025-10-15 01:09:52.268919+00', 'Mario', 'Nunes');
INSERT INTO public."Users" (id, name, email, keycloak_id, last_login, first_name, last_name) VALUES ('79b311db-909b-4513-be09-0b7185c89fe2', 'anacosta', 'anacosta@gmail.com', '1b0a704f-85cd-4197-9882-e66781715bd4', '2025-10-15 11:12:03.986566+00', 'Ana', 'Costa');
INSERT INTO public."Users" (id, name, email, keycloak_id, last_login, first_name, last_name) VALUES ('503d3e04-6815-4608-afa4-3f4b30c31adf', 'felipegomes', 'felipegomes@gmail.com', '7a17e468-91ab-44cf-a715-c62f7b7a8488', '2025-10-15 11:13:01.319955+00', 'Felipe', 'Gomes');
INSERT INTO public."Users" (id, name, email, keycloak_id, last_login, first_name, last_name) VALUES ('5191d06f-e840-43c6-9548-1ec0136e1224', 'viniciuslima', 'vinilima@gmail.com', '9f12ee2b-6563-49f7-85af-b22706f90b31', '2025-10-15 11:13:10.916525+00', 'Vinicius', 'Lima');
INSERT INTO public."Users" (id, name, email, keycloak_id, last_login, first_name, last_name) VALUES ('b8188bf4-84c8-4a38-8a23-0269c2ed755c', 'lucaspereira', 'lucaspereira@gmail.com', '0330b401-3420-48d9-a648-8f558b0095b9', '2025-10-15 11:13:28.145053+00', 'Lucas', 'Pereira');
INSERT INTO public."Users" (id, name, email, keycloak_id, last_login, first_name, last_name) VALUES ('213c0529-04a1-453e-8d4c-d903471ae4e8', 'marianasilva', 'marianasilva@gmail.com', 'fbbe5f55-4e36-468e-ab4d-0b823b046494', '2025-10-15 11:13:37.727765+00', 'Mariana', 'Silva');
INSERT INTO public."Users" (id, name, email, keycloak_id, last_login, first_name, last_name) VALUES ('fdbd32b7-3f25-4695-a8fe-f1a07a737425', 'testuser', 'userteste@gmail.com', 'a00987ac-fff0-40f5-8c1f-0849eccfb96f', '2025-10-15 11:55:49.876923+00', NULL, NULL);
INSERT INTO public."Users" (id, name, email, keycloak_id, last_login, first_name, last_name) VALUES ('7ded4be4-40d1-48ae-9247-6f20f672cf09', 'camilasantos', 'camilasantos@gmail.com', '0b6046d0-c080-440e-8932-ed2fec600c8a', '2025-10-15 12:46:50.180351+00', 'Camila', 'Santos');


--
-- Data for Name: WarehouseStaff; Type: TABLE DATA; Schema: public; Owner: slms_user
--

INSERT INTO public."WarehouseStaff" (user_id) VALUES ('f4ec55f9-2918-4b3a-a27c-f77a3e72fdb8');


--
-- Name: Notifications_id_seq; Type: SEQUENCE SET; Schema: public; Owner: slms_user
--

SELECT pg_catalog.setval('public."Notifications_id_seq"', 1, false);


--
-- Name: Carrier Carrier_pkey; Type: CONSTRAINT; Schema: public; Owner: slms_user
--

ALTER TABLE ONLY public."Carrier"
    ADD CONSTRAINT "Carrier_pkey" PRIMARY KEY (carrier_id);


--
-- Name: Costumer Costumer_pkey; Type: CONSTRAINT; Schema: public; Owner: slms_user
--

ALTER TABLE ONLY public."Costumer"
    ADD CONSTRAINT "Costumer_pkey" PRIMARY KEY (user_id);


--
-- Name: Csr Csr_pkey; Type: CONSTRAINT; Schema: public; Owner: slms_user
--

ALTER TABLE ONLY public."Csr"
    ADD CONSTRAINT "Csr_pkey" PRIMARY KEY (user_id);


--
-- Name: Driver Driver_pkey; Type: CONSTRAINT; Schema: public; Owner: slms_user
--

ALTER TABLE ONLY public."Driver"
    ADD CONSTRAINT "Driver_pkey" PRIMARY KEY (driver_id);


--
-- Name: LogisticsManager LogisticsManager_pkey; Type: CONSTRAINT; Schema: public; Owner: slms_user
--

ALTER TABLE ONLY public."LogisticsManager"
    ADD CONSTRAINT "LogisticsManager_pkey" PRIMARY KEY (user_id);


--
-- Name: Notifications Notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: slms_user
--

ALTER TABLE ONLY public."Notifications"
    ADD CONSTRAINT "Notifications_pkey" PRIMARY KEY (id);


--
-- Name: Orders Orders_pkey; Type: CONSTRAINT; Schema: public; Owner: slms_user
--

ALTER TABLE ONLY public."Orders"
    ADD CONSTRAINT "Orders_pkey" PRIMARY KEY (order_id);


--
-- Name: Shipments Shipments_pkey; Type: CONSTRAINT; Schema: public; Owner: slms_user
--

ALTER TABLE ONLY public."Shipments"
    ADD CONSTRAINT "Shipments_pkey" PRIMARY KEY (shipment_id);


--
-- Name: Users Users_pkey; Type: CONSTRAINT; Schema: public; Owner: slms_user
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_pkey" PRIMARY KEY (id);


--
-- Name: WarehouseStaff WarehouseStaff_pkey; Type: CONSTRAINT; Schema: public; Owner: slms_user
--

ALTER TABLE ONLY public."WarehouseStaff"
    ADD CONSTRAINT "WarehouseStaff_pkey" PRIMARY KEY (user_id);


--
-- Name: Users users_keycloak_id_key; Type: CONSTRAINT; Schema: public; Owner: slms_user
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT users_keycloak_id_key UNIQUE (keycloak_id);


--
-- Name: Users users_name_key; Type: CONSTRAINT; Schema: public; Owner: slms_user
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT users_name_key UNIQUE (name);


--
-- Name: idx_carrier_cost_history; Type: INDEX; Schema: public; Owner: slms_user
--

CREATE INDEX idx_carrier_cost_history ON public."Carrier" USING gin (cost_history);


--
-- Name: idx_driver_carrier_id; Type: INDEX; Schema: public; Owner: slms_user
--

CREATE INDEX idx_driver_carrier_id ON public."Driver" USING btree (carrier_id);


--
-- Name: idx_driver_user_id; Type: INDEX; Schema: public; Owner: slms_user
--

CREATE INDEX idx_driver_user_id ON public."Driver" USING btree (user_id);


--
-- Name: idx_notifications_created_at; Type: INDEX; Schema: public; Owner: slms_user
--

CREATE INDEX idx_notifications_created_at ON public."Notifications" USING btree (created_at DESC);


--
-- Name: idx_notifications_is_read; Type: INDEX; Schema: public; Owner: slms_user
--

CREATE INDEX idx_notifications_is_read ON public."Notifications" USING btree (is_read);


--
-- Name: idx_notifications_user_id; Type: INDEX; Schema: public; Owner: slms_user
--

CREATE INDEX idx_notifications_user_id ON public."Notifications" USING btree (user_id);


--
-- Name: idx_notifications_user_unread; Type: INDEX; Schema: public; Owner: slms_user
--

CREATE INDEX idx_notifications_user_unread ON public."Notifications" USING btree (user_id, is_read) WHERE (is_read = false);


--
-- Name: idx_orders_carrier_id; Type: INDEX; Schema: public; Owner: slms_user
--

CREATE INDEX idx_orders_carrier_id ON public."Orders" USING btree (carrier_id);


--
-- Name: idx_orders_costumer_id; Type: INDEX; Schema: public; Owner: slms_user
--

CREATE INDEX idx_orders_costumer_id ON public."Orders" USING btree (costumer_id);


--
-- Name: idx_orders_shipment_id; Type: INDEX; Schema: public; Owner: slms_user
--

CREATE INDEX idx_orders_shipment_id ON public."Orders" USING btree (shipment_id);


--
-- Name: idx_orders_status; Type: INDEX; Schema: public; Owner: slms_user
--

CREATE INDEX idx_orders_status ON public."Orders" USING btree (status);


--
-- Name: idx_shipments_carrier_id; Type: INDEX; Schema: public; Owner: slms_user
--

CREATE INDEX idx_shipments_carrier_id ON public."Shipments" USING btree (carrier_id);


--
-- Name: idx_shipments_driver_id; Type: INDEX; Schema: public; Owner: slms_user
--

CREATE INDEX idx_shipments_driver_id ON public."Shipments" USING btree (driver_id);


--
-- Name: idx_shipments_status; Type: INDEX; Schema: public; Owner: slms_user
--

CREATE INDEX idx_shipments_status ON public."Shipments" USING btree (status);


--
-- Name: idx_users_keycloak_id; Type: INDEX; Schema: public; Owner: slms_user
--

CREATE INDEX idx_users_keycloak_id ON public."Users" USING btree (keycloak_id);


--
-- Name: idx_users_name; Type: INDEX; Schema: public; Owner: slms_user
--

CREATE INDEX idx_users_name ON public."Users" USING btree (name);


--
-- Name: Costumer Costumer_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: slms_user
--

ALTER TABLE ONLY public."Costumer"
    ADD CONSTRAINT "Costumer_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public."Users"(id) ON DELETE CASCADE;


--
-- Name: Csr Csr_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: slms_user
--

ALTER TABLE ONLY public."Csr"
    ADD CONSTRAINT "Csr_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public."Users"(id) ON DELETE CASCADE;


--
-- Name: Driver Driver_carrier_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: slms_user
--

ALTER TABLE ONLY public."Driver"
    ADD CONSTRAINT "Driver_carrier_id_fkey" FOREIGN KEY (carrier_id) REFERENCES public."Carrier"(carrier_id) ON DELETE SET NULL;


--
-- Name: Driver Driver_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: slms_user
--

ALTER TABLE ONLY public."Driver"
    ADD CONSTRAINT "Driver_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public."Users"(id) ON DELETE CASCADE;


--
-- Name: LogisticsManager LogisticsManager_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: slms_user
--

ALTER TABLE ONLY public."LogisticsManager"
    ADD CONSTRAINT "LogisticsManager_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public."Users"(id) ON DELETE CASCADE;


--
-- Name: Notifications Notifications_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: slms_user
--

ALTER TABLE ONLY public."Notifications"
    ADD CONSTRAINT "Notifications_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public."Users"(id) ON DELETE CASCADE;


--
-- Name: Orders Orders_carrier_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: slms_user
--

ALTER TABLE ONLY public."Orders"
    ADD CONSTRAINT "Orders_carrier_id_fkey" FOREIGN KEY (carrier_id) REFERENCES public."Carrier"(carrier_id) ON DELETE SET NULL;


--
-- Name: Orders Orders_costumer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: slms_user
--

ALTER TABLE ONLY public."Orders"
    ADD CONSTRAINT "Orders_costumer_id_fkey" FOREIGN KEY (costumer_id) REFERENCES public."Costumer"(user_id) ON DELETE SET NULL;


--
-- Name: Orders Orders_shipment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: slms_user
--

ALTER TABLE ONLY public."Orders"
    ADD CONSTRAINT "Orders_shipment_id_fkey" FOREIGN KEY (shipment_id) REFERENCES public."Shipments"(shipment_id) ON DELETE SET NULL;


--
-- Name: Shipments Shipments_carrier_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: slms_user
--

ALTER TABLE ONLY public."Shipments"
    ADD CONSTRAINT "Shipments_carrier_id_fkey" FOREIGN KEY (carrier_id) REFERENCES public."Carrier"(carrier_id) ON DELETE SET NULL;


--
-- Name: Shipments Shipments_driver_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: slms_user
--

ALTER TABLE ONLY public."Shipments"
    ADD CONSTRAINT "Shipments_driver_id_fkey" FOREIGN KEY (driver_id) REFERENCES public."Driver"(driver_id) ON DELETE SET NULL;


--
-- Name: WarehouseStaff WarehouseStaff_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: slms_user
--

ALTER TABLE ONLY public."WarehouseStaff"
    ADD CONSTRAINT "WarehouseStaff_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public."Users"(id) ON DELETE CASCADE;


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: slms_user
--

REVOKE USAGE ON SCHEMA public FROM PUBLIC;


--
-- PostgreSQL database dump complete
--

\unrestrict BZ8M0UlpWwk8TUqJeyriXzZWfbcLH4IVJjOeW8762wwWfc4TXF6CTc548FENlbz

