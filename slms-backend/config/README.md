Centralized backend configuration
=================================

How to use
----------

1. Copy `.env.template` to `.env` in the `shipping_backend` folder and fill your real credentials. **Do not commit `.env`.**

2. Each service can use the provided `docker-compose.supabase.yml.template` as a starting point. Rename to `docker-compose.supabase.yml` and adjust `ports` or `image` fields if necessary.

3. The compose template mounts `config/application-db.yml` into `/shared-config/application-db.yml` inside the container and sets `SPRING_CONFIG_ADDITIONAL_LOCATION`. Spring Boot will read that file in addition to the application's packaged `application.yml`.

4. For production, prefer using secrets (Docker secrets, CI/CD secrets, or Vault) instead of `.env`.

Notes
-----
- `application-db.yml` is safe to commit because it references environment variables for secrets. Only `.env` contains secrets.
- If a service needs a different DB or role, create a per-service override file (e.g., `application-db-override.yml`) and mount it similarly.
