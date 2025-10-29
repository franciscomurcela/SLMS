#!/bin/bash
# Script para reiniciar o Keycloak com configuração HTTPS

echo "🔄 Reiniciando Keycloak com configuração HTTPS..."

cd ~/rep/group-project-es2526_204/slms-backend/authentication_service

echo "📋 Parando Keycloak..."
docker-compose -f docker-compose.keycloak.yml down

echo "⏳ Aguardando 5 segundos..."
sleep 5

echo "🚀 Iniciando Keycloak com nova configuração..."
docker-compose -f docker-compose.keycloak.yml up -d

echo "⏳ Aguardando Keycloak iniciar (pode demorar 30-60 segundos)..."
echo "   Verificando health check..."

for i in {1..60}; do
    if curl -s http://localhost:8083/auth/health/ready > /dev/null 2>&1; then
        echo ""
        echo "✅ Keycloak iniciado com sucesso!"
        break
    fi
    echo -n "."
    sleep 2
done

echo ""
echo ""

# Testar o endpoint
echo "🧪 Testando Keycloak..."
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8083/auth/)
echo "   Resposta HTTP do Keycloak: $RESPONSE"

if [ "$RESPONSE" = "200" ] || [ "$RESPONSE" = "303" ]; then
    echo "   ✅ Keycloak respondendo corretamente!"
else
    echo "   ⚠️  Keycloak pode ainda estar inicializando"
    echo "   💡 Aguarde mais 30 segundos e teste: curl http://localhost:8083/auth/"
fi

echo ""
echo "🔒 Testando via HTTPS (Nginx)..."
HTTPS_RESPONSE=$(curl -k -s -o /dev/null -w "%{http_code}" https://localhost/auth/)
echo "   Resposta via Nginx HTTPS: $HTTPS_RESPONSE"

if [ "$HTTPS_RESPONSE" = "200" ] || [ "$HTTPS_RESPONSE" = "303" ]; then
    echo "   ✅ Proxy HTTPS funcionando!"
else
    echo "   ⚠️  Proxy pode precisar de reload"
    echo "   💡 Execute: sudo systemctl reload nginx"
fi

echo ""
echo "═══════════════════════════════════════"
echo "✨ Configuração completa!"
echo ""
echo "🌐 Acesse: https://192.168.160.9"
echo "🔑 Keycloak: https://192.168.160.9/auth/"
echo "👤 Admin: https://192.168.160.9/auth/admin/"
echo "   User: admin"
echo "   Pass: admin"
echo ""
echo "📋 Ver logs: docker logs -f keycloak"
