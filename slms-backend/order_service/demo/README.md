Demo service (order_service/demo)

Quick start (local with Supabase pooler)

1. Create `.env` in this folder (do NOT commit it). Example contents:

SPRING_DATASOURCE_URL=jdbc:postgresql://aws-1-us-east-2.pooler.supabase.com:6543/postgres?sslmode=require
SPRING_DATASOURCE_USERNAME=postgres.pylhwbcmavnjfczwribo
SPRING_DATASOURCE_PASSWORD=YOUR_DB_PASSWORD
DB_HOST=aws-1-us-east-2.pooler.supabase.com
DB_PORT=6543
DB_NAME=postgres
DB_USER=postgres.pylhwbcmavnjfczwribo
DB_PASS=YOUR_DB_PASSWORD

2. Start with docker compose (uses `docker-compose.supabase.yml` to read `.env`):

cd shipping_backend/order_service/demo
docker compose -f docker-compose.yml -f docker-compose.supabase.yml up --build

3. Test the API (example):

# from host
curl http://localhost:8081/api/orders

Notes
- The demo app uses Spring Boot + JPA and expects a Postgres database. The `.env` values are read by the compose override so the container picks up your Supabase pooler credentials.
- Keep `.env` out of Git. For production, use secrets managers or Docker secrets.
