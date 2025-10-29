#!/bin/bash
# Script para diagnosticar o problema com o Keycloak

echo "🔍 Diagnóstico HTTPS + Keycloak"
echo "================================"
echo ""

# 1. Verificar se o Keycloak está rodando
echo "1️⃣  Verificando Keycloak (porta 8083):"
if nc -z localhost 8083 2>/dev/null || timeout 1 bash -c "</dev/tcp/localhost/8083" 2>/dev/null; then
    echo "   ✅ Keycloak está respondendo na porta 8083"
else
    echo "   ❌ Keycloak NÃO está respondendo na porta 8083"
    echo "   💡 Execute: cd slms-backend/authentication_service && docker-compose up -d"
fi
echo ""

# 2. Testar conexão direta ao Keycloak
echo "2️⃣  Testando Keycloak diretamente:"
KEYCLOAK_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8083/ 2>/dev/null || echo "FAIL")
if [ "$KEYCLOAK_RESPONSE" = "200" ] || [ "$KEYCLOAK_RESPONSE" = "303" ] || [ "$KEYCLOAK_RESPONSE" = "301" ]; then
    echo "   ✅ Keycloak responde: HTTP $KEYCLOAK_RESPONSE"
else
    echo "   ❌ Keycloak não responde (código: $KEYCLOAK_RESPONSE)"
fi
echo ""

# 3. Testar proxy /auth/ através do Nginx
echo "3️⃣  Testando proxy /auth/ através do Nginx HTTPS:"
AUTH_RESPONSE=$(curl -k -s -o /dev/null -w "%{http_code}" https://localhost/auth/ 2>/dev/null || echo "FAIL")
echo "   Resposta: HTTP $AUTH_RESPONSE"
if [ "$AUTH_RESPONSE" = "200" ] || [ "$AUTH_RESPONSE" = "303" ] || [ "$AUTH_RESPONSE" = "301" ]; then
    echo "   ✅ Proxy funcionando"
else
    echo "   ❌ Proxy com problemas"
fi
echo ""

# 4. Verificar outros serviços
echo "4️⃣  Verificando outros serviços backend:"
for service in "3000:Frontend" "8080:Carrier" "8081:Order" "8082:User"; do
    port=$(echo $service | cut -d: -f1)
    name=$(echo $service | cut -d: -f2)
    if nc -z localhost $port 2>/dev/null || timeout 1 bash -c "</dev/tcp/localhost/$port" 2>/dev/null; then
        echo "   ✅ $name (porta $port)"
    else
        echo "   ❌ $name (porta $port) - não está rodando"
    fi
done
echo ""

# 5. Ver logs do Nginx
echo "5️⃣  Últimas linhas do log de erro do Nginx:"
if [ -f /var/log/nginx/slms_https_error.log ]; then
    sudo tail -5 /var/log/nginx/slms_https_error.log | sed 's/^/   /'
elif [ -f /var/log/nginx/error.log ]; then
    sudo tail -5 /var/log/nginx/error.log | sed 's/^/   /'
else
    echo "   ℹ️  Nenhum log encontrado"
fi
echo ""

# 6. Testar URLs específicas
echo "6️⃣  Testando URLs específicas:"
echo "   Frontend (/):"
curl -k -s -o /dev/null -w "      HTTP %{http_code}\n" https://localhost/ 2>/dev/null

echo "   Keycloak (/auth/):"
curl -k -s -o /dev/null -w "      HTTP %{http_code}\n" https://localhost/auth/ 2>/dev/null

echo "   Realm (/auth/realms/ESg204):"
curl -k -s -o /dev/null -w "      HTTP %{http_code}\n" https://localhost/auth/realms/ESg204 2>/dev/null
echo ""

# 7. Verificar configuração do Nginx
echo "7️⃣  Configuração Nginx para /auth/:"
if [ -f /etc/nginx/sites-available/slms ]; then
    echo "   Localizações configuradas:"
    sudo grep -E "location.*\{" /etc/nginx/sites-available/slms | sed 's/^/      /'
else
    echo "   ❌ Arquivo de configuração não encontrado"
fi
echo ""

echo "================================"
echo "💡 Próximos passos:"
echo "   1. Se Keycloak não está rodando: inicie os serviços"
echo "   2. Se proxy não funciona: verifique logs acima"
echo "   3. Teste diretamente: curl -k https://localhost/auth/"
