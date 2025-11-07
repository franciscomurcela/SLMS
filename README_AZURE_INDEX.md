# 🚀 Azure Deployment - Índice de Documentação

Este é o índice central para toda a documentação relacionada com o deployment do projeto SLMS no Microsoft Azure.

---

## 📚 Documentos Principais

### 1. 🎯 [AZURE_DEPLOYMENT_GUIDE.md](./AZURE_DEPLOYMENT_GUIDE.md) - **COMECE AQUI!**
**Guia completo passo-a-passo para fazer o deployment inicial**

Este é o documento principal. Contém:
- ✅ Pré-requisitos e software necessário
- ✅ **Fase 1:** Bootstrap inicial (criar infraestrutura pela primeira vez)
- ✅ **Fase 2:** Deploys automáticos via CI/CD
- ✅ Como desenvolver localmente
- ✅ Troubleshooting detalhado

**Quando usar:** Quando for fazer o deployment pela primeira vez ou ensinar alguém novo.

---

### 2. ⚡ [QUICK_REFERENCE_AZURE.md](./QUICK_REFERENCE_AZURE.md)
**Referência rápida para uso diário**

Contém:
- 📋 Comandos essenciais (Terraform, Docker, Azure CLI)
- 🔗 URLs importantes
- 🔄 Workflow diário simplificado
- 🚨 Troubleshooting rápido
- 💰 Custos estimados

**Quando usar:** Depois de já ter feito o setup inicial e precisa de comandos rápidos.

---

### 3. ✅ [MIGRATION_CHECKLIST.md](./MIGRATION_CHECKLIST.md)
**Lista de tarefas e alterações necessárias nos ficheiros**

Contém:
- 📝 Alterações necessárias em cada ficheiro existente
- ✅ Checklist completo de migração (Fase 1, 2, 3, 4)
- 🔧 Comandos para testar cada componente
- 📦 Como adicionar novos serviços (microservices)

**Quando usar:** Durante a migração, para garantir que não esqueceu nada.

---

### 4. 🏗️ [ARCHITECTURE.md](./ARCHITECTURE.md)
**Diagrama e explicação da arquitetura técnica**

Contém:
- 📊 Diagramas visuais da arquitetura
- 🔄 Fluxo de deploy detalhado
- 🔐 Modelo de segurança (Managed Identity)
- 📈 Escalabilidade e alta disponibilidade
- 💰 Breakdown de custos
- 📊 Monitoring e logging

**Quando usar:** Para entender como tudo funciona, ou explicar a arquitetura a alguém.

---

## 📂 Estrutura de Ficheiros Criados

```
project-root/
├── terraform/                      # Infraestrutura como código
│   ├── main.tf                    # Recursos principais do Azure
│   ├── variables.tf               # Variáveis do Terraform
│   ├── outputs.tf                 # Outputs (URLs, IPs, etc.)
│   └── terraform.tfvars.example   # Exemplo de variáveis (copiar para .tfvars)
│
├── .github/workflows/
│   └── deploy.yml                 # Pipeline CI/CD (GitHub Actions)
│
├── scripts/
│   ├── bootstrap-azure.ps1        # Script PowerShell para bootstrap automático
│   └── setup-github-runner.sh    # Script para instalar runner na VM
│
├── react-frontend/frontend/
│   ├── nginx-azure.conf.template  # Nginx config com variáveis de ambiente
│   └── entrypoint.sh              # Script para processar variáveis no nginx
│
├── slms-backend/
│   └── application-azure.properties.example  # Exemplo de config para Azure
│
├── docker-compose.local.yml       # Docker Compose para desenvolvimento local
├── .env.example                   # Exemplo de variáveis de ambiente locais
│
└── Documentação:
    ├── AZURE_DEPLOYMENT_GUIDE.md  # 📘 Guia completo (PRINCIPAL)
    ├── QUICK_REFERENCE_AZURE.md   # ⚡ Referência rápida
    ├── MIGRATION_CHECKLIST.md     # ✅ Checklist de migração
    ├── ARCHITECTURE.md            # 🏗️ Arquitetura detalhada
    └── README_AZURE_INDEX.md      # 📚 Este ficheiro (índice)
```

---

## 🎬 Fluxo de Trabalho Recomendado

### Para quem está a fazer o setup pela primeira vez:

```
1. Ler AZURE_DEPLOYMENT_GUIDE.md (Pré-requisitos)
        ↓
2. Instalar software necessário (Azure CLI, Terraform)
        ↓
3. Seguir MIGRATION_CHECKLIST.md (preparar ficheiros)
        ↓
4. Executar bootstrap-azure.ps1 (OU seguir guia manual)
        ↓
5. SSH para VM e executar setup-github-runner.sh
        ↓
6. Criar GitHub Secrets
        ↓
7. git push (primeiro deploy automático!)
        ↓
8. Guardar QUICK_REFERENCE_AZURE.md para uso diário
```

### Para uso diário (depois do setup):

```
1. Fazer alterações no código
        ↓
2. Testar localmente (opcional): docker-compose -f docker-compose.local.yml up
        ↓
3. git commit & git push
        ↓
4. GitHub Actions faz o deploy automaticamente!
        ↓
5. Verificar URL do frontend (se necessário)
```

---

## 🎓 Conceitos-Chave

### O Problema Original
- ❌ Contas de estudante Azure não podem criar **Service Principals**
- ❌ Não conseguimos autenticar o GitHub Actions de forma tradicional
- ❌ Sem `AZURE_CREDENTIALS` secret

### A Solução Implementada
- ✅ **VM com System-Assigned Managed Identity**
- ✅ VM tem role **Contributor** no Resource Group
- ✅ GitHub Runner corre **dentro da VM** (self-hosted)
- ✅ Runner autentica-se com `az login --identity` (sem secrets!)
- ✅ Runner pode criar/atualizar recursos Azure e fazer push para ACR

### Por que isto funciona?
1. A VM faz parte do Azure (tem identidade nativa)
2. A identidade tem permissões (role assignment)
3. O runner corre dentro da VM (herda as permissões)
4. Não precisa de passwords ou tokens!

---

## 🆘 Onde Procurar Ajuda

### Durante o Setup Inicial
- 📘 **AZURE_DEPLOYMENT_GUIDE.md** → Secção "Troubleshooting"
- ✅ **MIGRATION_CHECKLIST.md** → Ver o que pode ter faltado

### Erros de Deploy (CI/CD)
- 🔗 GitHub Actions logs (no repositório)
- 📊 Azure Portal → Container Apps → Log stream
- ⚡ **QUICK_REFERENCE_AZURE.md** → Troubleshooting rápido

### Entender Como Funciona
- 🏗️ **ARCHITECTURE.md** → Diagramas e fluxos

### Erros de Terraform
```bash
cd terraform
terraform state list              # Ver todos os recursos
terraform state show <resource>   # Ver detalhes de um recurso
terraform plan                    # Ver o que vai mudar
```

---

## 📋 Verificação Rápida (Está tudo OK?)

Use esta checklist para verificar se o deployment está funcionando:

### Infraestrutura (Azure)
- [ ] Resource Group `slms-rg` existe
- [ ] ACR tem imagens (backend e frontend)
- [ ] PostgreSQL está acessível
- [ ] Container Apps estão rodando (sem erros)
- [ ] Frontend URL está acessível (HTTPS)

### GitHub
- [ ] Runner `azure-runner` está online (Idle, verde)
- [ ] Secrets estão criados (ACR_NAME, RESOURCE_GROUP, etc.)
- [ ] Último workflow executou com sucesso

### Local (para desenvolvimento)
- [ ] `.env` existe (copiado de `.env.example`)
- [ ] `terraform.tfvars` existe e está no `.gitignore`
- [ ] `docker-compose -f docker-compose.local.yml up` funciona

---

## 🎯 Objetivos Alcançados

### ✅ Funcional
- [x] Deployment automático via GitHub Actions
- [x] Infraestrutura gerida com Terraform
- [x] Contorna limitação de Service Principal (Managed Identity)
- [x] Backend privado, frontend público
- [x] Base de dados PostgreSQL gerida
- [x] Desenvolvimento local com Docker Compose

### ✅ Segurança
- [x] Sem credentials hardcoded
- [x] Secrets geridos (Terraform + GitHub Secrets)
- [x] Backend não exposto publicamente
- [x] HTTPS automático nas Container Apps

### ✅ Manutenibilidade
- [x] Infraestrutura como código (Terraform)
- [x] Pipeline CI/CD automatizado
- [x] Logs centralizados (Log Analytics)
- [x] Documentação completa

---

## 🚀 Próximos Passos Sugeridos

Depois de ter tudo funcionando, considere:

1. **Adicionar mais serviços:**
   - Ver `MIGRATION_CHECKLIST.md` → "Fase 4: Adicionar Serviços Adicionais"
   - Adicionar Container Apps para `carrier_service`, `order_service`, etc.

2. **Melhorar monitoring:**
   - Configurar Application Insights
   - Criar alertas (email quando erro acontece)
   - Dashboard no Azure Portal

3. **Otimizar custos:**
   - Parar recursos quando não usados (dev/staging)
   - Usar `terraform destroy` em ambientes temporários

4. **Melhorar CI/CD:**
   - Adicionar testes automatizados no pipeline
   - Implementar deploy strategies (blue-green, canary)
   - Adicionar aprovações manuais para produção

---

## 📞 Contactos e Recursos

### Documentação Oficial
- [Azure Container Apps](https://learn.microsoft.com/azure/container-apps/)
- [Terraform Azure Provider](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs)
- [GitHub Actions](https://docs.github.com/actions)
- [Azure Managed Identities](https://learn.microsoft.com/azure/active-directory/managed-identities-azure-resources/)

### Ferramentas
- [Azure Portal](https://portal.azure.com)
- [GitHub Repository](https://github.com/detiuaveiro/group-project-es2526_204)

---

## 🎉 Conclusão

Este setup permite-lhe:
- 🚀 Deploy automático com `git push`
- 🔒 Segurança sem credentials expostos
- 💰 Custos controlados (dentro do crédito estudante)
- 🧪 Desenvolvimento local fácil
- 📈 Escalabilidade automática

**Tudo isto contornando a limitação de não poder criar Service Principals!**

---

**Última atualização:** Novembro 2025  
**Autor:** Assistente AI (GitHub Copilot)  
**Projeto:** SLMS - Shipment Logistics Management System  
**Universidade:** DETI - Universidade de Aveiro
