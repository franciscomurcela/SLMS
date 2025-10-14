# 📜 Scripts

## start-project (Linux/Mac/Windows)

Inicia todo o projeto automaticamente:

**Linux/Mac:**
```bash
bash scripts/start-project.sh
```

**Windows:**
```powershell
.\scripts\start-project.ps1
```

**O que faz:**
1. Cria ficheiro `.env` com credenciais
2. Inicia containers Docker (Keycloak, User Service, Carrier Service)
3. Verifica/instala dependências do frontend

## create-env (Linux/Mac)

Cria apenas o ficheiro `.env`:

```bash
bash scripts/create-env.sh
```

**Nota:** No Windows, usar `start-project.ps1` que cria o `.env` automaticamente.

## 📝 Editar Credenciais

Para alterar credenciais Supabase ou base de dados:

1. **Linux/Mac:** Editar `scripts/create-env.sh`
2. **Windows:** Editar `scripts/start-project.ps1`

Depois recriar o `.env`:
```bash
rm slms-backend/.env
bash scripts/create-env.sh  # ou .\scripts\start-project.ps1
```
