--
-- PostgreSQL database dump
--

-- Dumped from database version 17.6
-- Dumped by pg_dump version 18.0

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Data for Name: Carrier; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public."Carrier" (carrier_id, name, avg_cost, on_time_rate, success_rate) VALUES ('035e3667-66e1-4f90-abf8-e45caab9b1f2', 'FedEx', 14.5, 0.96, 0.99);
INSERT INTO public."Carrier" (carrier_id, name, avg_cost, on_time_rate, success_rate) VALUES ('a56c5b31-b805-4144-95ce-173c3ad23c8e', 'UPS', 12.8, 0.94, 0.97);
INSERT INTO public."Carrier" (carrier_id, name, avg_cost, on_time_rate, success_rate) VALUES ('193c9b19-b485-4bd3-bf9c-7414f2bde2b3', 'DPD', 10.2, 0.91, 0.95);
INSERT INTO public."Carrier" (carrier_id, name, avg_cost, on_time_rate, success_rate) VALUES ('c0d95338-90df-4926-810d-be518c8a5e53', 'DHL', 13.7, 0.95, 0.98);


--
-- Data for Name: Users; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public."Users" (id, name, email, keycloak_id, last_login, first_name, last_name) VALUES ('bab4f237-718e-4fd3-82e1-6451b2ac8c2b', 'fabiofigueiredo', 'fabiofig@gmail.com', '0705b8aa-f064-45f3-ba03-10065db96c7c', '2025-10-15 00:52:37.043786', 'Fabio', 'Figueiredo');
INSERT INTO public."Users" (id, name, email, keycloak_id, last_login, first_name, last_name) VALUES ('f4ec55f9-2918-4b3a-a27c-f77a3e72fdb8', 'ricardocastro', 'ricastro@gmail.com', 'c2f523c8-0101-4f11-8335-462408e79ab4', '2025-10-15 00:53:12.323677', 'Ricardo', 'Castro');
INSERT INTO public."Users" (id, name, email, keycloak_id, last_login, first_name, last_name) VALUES ('b03981b3-c6d6-4d20-9a4c-93d7a4b9ce86', 'mikedias', 'mikedias@gmail.com', '0fa1c37d-894e-43f6-8bd4-b20f9fd110f9', '2025-10-15 00:53:19.624742', 'Miguel', 'Dias');
INSERT INTO public."Users" (id, name, email, keycloak_id, last_login, first_name, last_name) VALUES ('15594613-166d-4dab-ac19-6dff958374d0', 'marionunes', 'marionunes@gmail.com', 'dd675677-5eaf-45eb-9498-3ce2315ff129', '2025-10-15 01:09:52.268919', 'Mario', 'Nunes');
INSERT INTO public."Users" (id, name, email, keycloak_id, last_login, first_name, last_name) VALUES ('79b311db-909b-4513-be09-0b7185c89fe2', 'anacosta', 'anacosta@gmail.com', '1b0a704f-85cd-4197-9882-e66781715bd4', '2025-10-15 11:12:03.986566', 'Ana', 'Costa');
INSERT INTO public."Users" (id, name, email, keycloak_id, last_login, first_name, last_name) VALUES ('503d3e04-6815-4608-afa4-3f4b30c31adf', 'felipegomes', 'felipegomes@gmail.com', '7a17e468-91ab-44cf-a715-c62f7b7a8488', '2025-10-15 11:13:01.319955', 'Felipe', 'Gomes');
INSERT INTO public."Users" (id, name, email, keycloak_id, last_login, first_name, last_name) VALUES ('5191d06f-e840-43c6-9548-1ec0136e1224', 'viniciuslima', 'vinilima@gmail.com', '9f12ee2b-6563-49f7-85af-b22706f90b31', '2025-10-15 11:13:10.916525', 'Vinicius', 'Lima');
INSERT INTO public."Users" (id, name, email, keycloak_id, last_login, first_name, last_name) VALUES ('b8188bf4-84c8-4a38-8a23-0269c2ed755c', 'lucaspereira', 'lucaspereira@gmail.com', '0330b401-3420-48d9-a648-8f558b0095b9', '2025-10-15 11:13:28.145053', 'Lucas', 'Pereira');
INSERT INTO public."Users" (id, name, email, keycloak_id, last_login, first_name, last_name) VALUES ('213c0529-04a1-453e-8d4c-d903471ae4e8', 'marianasilva', 'marianasilva@gmail.com', 'fbbe5f55-4e36-468e-ab4d-0b823b046494', '2025-10-15 11:13:37.727765', 'Mariana', 'Silva');
INSERT INTO public."Users" (id, name, email, keycloak_id, last_login, first_name, last_name) VALUES ('fdbd32b7-3f25-4695-a8fe-f1a07a737425', 'testuser', 'userteste@gmail.com', 'a00987ac-fff0-40f5-8c1f-0849eccfb96f', '2025-10-15 11:55:49.876923', NULL, NULL);
INSERT INTO public."Users" (id, name, email, keycloak_id, last_login, first_name, last_name) VALUES ('7ded4be4-40d1-48ae-9247-6f20f672cf09', 'camilasantos', 'camilasantos@gmail.com', '0b6046d0-c080-440e-8932-ed2fec600c8a', '2025-10-15 12:46:50.180351', 'Camila', 'Santos');


--
-- Data for Name: Costumer; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public."Costumer" (user_id, phone) VALUES ('b03981b3-c6d6-4d20-9a4c-93d7a4b9ce86', '15');
INSERT INTO public."Costumer" (user_id, phone) VALUES ('79b311db-909b-4513-be09-0b7185c89fe2', '15');
INSERT INTO public."Costumer" (user_id, phone) VALUES ('503d3e04-6815-4608-afa4-3f4b30c31adf', '15');
INSERT INTO public."Costumer" (user_id, phone) VALUES ('5191d06f-e840-43c6-9548-1ec0136e1224', '15');


--
-- Data for Name: Csr; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public."Csr" (user_id) VALUES ('7ded4be4-40d1-48ae-9247-6f20f672cf09');


--
-- Data for Name: Driver; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public."Driver" (user_id, carrier_id, driver_id) VALUES ('15594613-166d-4dab-ac19-6dff958374d0', '035e3667-66e1-4f90-abf8-e45caab9b1f2', '0165cc88-6569-409d-b81f-e7ae473c0fa1');
INSERT INTO public."Driver" (user_id, carrier_id, driver_id) VALUES ('b8188bf4-84c8-4a38-8a23-0269c2ed755c', 'a56c5b31-b805-4144-95ce-173c3ad23c8e', 'fb81680d-e588-448a-8d2d-8bfae5148560');
INSERT INTO public."Driver" (user_id, carrier_id, driver_id) VALUES ('213c0529-04a1-453e-8d4c-d903471ae4e8', '035e3667-66e1-4f90-abf8-e45caab9b1f2', '31d122fb-5b2e-442f-ae1e-80294df19db3');


--
-- Data for Name: LogisticsManager; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public."LogisticsManager" (user_id) VALUES ('bab4f237-718e-4fd3-82e1-6451b2ac8c2b');


--
-- Data for Name: Shipments; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public."Shipments" (shipment_id, carrier_id, driver_id, departure_time, arrival_time, status) VALUES ('1a1e9195-782b-440b-810c-8def17edc9a7', '035e3667-66e1-4f90-abf8-e45caab9b1f2', '31d122fb-5b2e-442f-ae1e-80294df19db3', '2025-10-15 11:27:33.355162', '2025-10-15 11:27:33.355162', 'Pending');
INSERT INTO public."Shipments" (shipment_id, carrier_id, driver_id, departure_time, arrival_time, status) VALUES ('b2319ba9-7137-4610-813c-920ac55b2c5f', '193c9b19-b485-4bd3-bf9c-7414f2bde2b3', '0165cc88-6569-409d-b81f-e7ae473c0fa1', '2025-10-15 11:27:14.353847', '2025-10-15 11:27:14.353847', 'Pending');
INSERT INTO public."Shipments" (shipment_id, carrier_id, driver_id, departure_time, arrival_time, status) VALUES ('b1ca0b16-f414-47fa-ae8b-49c8616049c1', 'a56c5b31-b805-4144-95ce-173c3ad23c8e', 'fb81680d-e588-448a-8d2d-8bfae5148560', '2025-10-15 12:27:21', '2025-10-15 11:27:51.136221', 'InTransit');


--
-- Data for Name: Orders; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public."Orders" (costumer_id, order_date, origin_address, destination_address, weight, tracking_id, actual_delivery_time, shipment_id, pod, order_id, status, carrier_id) VALUES ('503d3e04-6815-4608-afa4-3f4b30c31adf', '2025-10-15 12:38:12', 'Rua das Flores, 120', 'Rua das Palmeiras, 210', 23.2, 'c6d018e9-d265-4679-bc40-d42e5f6ed46b', NULL, '1a1e9195-782b-440b-810c-8def17edc9a7', '255', '0c0d68ec-8da8-440a-a159-b9f71061e273', 'Pending', '193c9b19-b485-4bd3-bf9c-7414f2bde2b3');
INSERT INTO public."Orders" (costumer_id, order_date, origin_address, destination_address, weight, tracking_id, actual_delivery_time, shipment_id, pod, order_id, status, carrier_id) VALUES ('79b311db-909b-4513-be09-0b7185c89fe2', '2025-10-15 12:40:38', 'Rua das Flores, 120', 'Rua das Acácias, 145', 9.3, 'd0d1fdf3-5e2f-420f-87ac-0396833b0aca', NULL, 'b2319ba9-7137-4610-813c-920ac55b2c5f', '255', '3d88f621-9667-4da9-8920-f85f21907195', 'Pending', '035e3667-66e1-4f90-abf8-e45caab9b1f2');
INSERT INTO public."Orders" (costumer_id, order_date, origin_address, destination_address, weight, tracking_id, actual_delivery_time, shipment_id, pod, order_id, status, carrier_id) VALUES ('503d3e04-6815-4608-afa4-3f4b30c31adf', '2025-10-15 12:31:22', 'Rua das Flores, 120', 'Av. Central, 500', 2.3, '71e7f15d-32c8-4643-ae82-07c7922c2f15', NULL, '1a1e9195-782b-440b-810c-8def17edc9a7', '255', '9e4418b9-625e-4396-a6fb-9d141b08debc', 'InTransit', '035e3667-66e1-4f90-abf8-e45caab9b1f2');
INSERT INTO public."Orders" (costumer_id, order_date, origin_address, destination_address, weight, tracking_id, actual_delivery_time, shipment_id, pod, order_id, status, carrier_id) VALUES ('503d3e04-6815-4608-afa4-3f4b30c31adf', '2025-10-15 12:37:11', 'Rua das Flores, 210', 'Rua das Palmeiras, 210', 12.3, 'ae939af6-a572-4f88-9b51-3e253e288371', NULL, '1a1e9195-782b-440b-810c-8def17edc9a7', '255', 'c1e9deb8-5a03-4b39-b081-f58405ad056b', 'InTransit', 'a56c5b31-b805-4144-95ce-173c3ad23c8e');
INSERT INTO public."Orders" (costumer_id, order_date, origin_address, destination_address, weight, tracking_id, actual_delivery_time, shipment_id, pod, order_id, status, carrier_id) VALUES ('5191d06f-e840-43c6-9548-1ec0136e1224', '2025-10-15 12:38:22', 'Rua das Flores, 120', 'Rua São Bento, 77', 5.2, '039e0cfa-a791-416f-bfc9-dece9c6c5068', NULL, 'b1ca0b16-f414-47fa-ae8b-49c8616049c1', '255', '928c5da4-5e83-4544-bdf3-d204c47f172e', 'InTransit', 'a56c5b31-b805-4144-95ce-173c3ad23c8e');
INSERT INTO public."Orders" (costumer_id, order_date, origin_address, destination_address, weight, tracking_id, actual_delivery_time, shipment_id, pod, order_id, status, carrier_id) VALUES ('5191d06f-e840-43c6-9548-1ec0136e1224', '2025-10-15 12:40:04', 'Rua das Flores, 120', 'Av. Atlântica, 1500', 30.2, '9315a70a-ae2e-4a64-8d67-07508155500d', NULL, 'b1ca0b16-f414-47fa-ae8b-49c8616049c1', '255', '3e60fddd-8836-422a-985d-6a623728347c', 'InTransit', 'a56c5b31-b805-4144-95ce-173c3ad23c8e');


--
-- Data for Name: WarehouseStaff; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public."WarehouseStaff" (user_id) VALUES ('f4ec55f9-2918-4b3a-a27c-f77a3e72fdb8');


--
-- PostgreSQL database dump complete
--

