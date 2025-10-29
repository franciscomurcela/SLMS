#!/bin/bash
# Script para reiniciar apenas o Keycloak com configuração HTTPS

echo "🔄 Reiniciando Keycloak com configuração HTTPS..."

cd ~/rep/group-project-es2526_204/slms-backend

echo "📋 Parando apenas o Keycloak..."
docker-compose stop keycloak
docker-compose rm -f keycloak

echo "⏳ Aguardando 3 segundos..."
sleep 3

echo "🚀 Iniciando Keycloak com nova configuração..."
docker-compose up -d keycloak

echo "⏳ Aguardando Keycloak iniciar (30-60 segundos)..."
echo "   Isto pode demorar um pouco na primeira vez..."

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

# Testar endpoints
echo "🧪 Testando Keycloak..."
HTTP_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8083/auth/ 2>/dev/null)
echo "   HTTP direto: $HTTP_RESPONSE"

HTTPS_RESPONSE=$(curl -k -s -o /dev/null -w "%{http_code}" https://localhost/auth/ 2>/dev/null)
echo "   HTTPS (Nginx): $HTTPS_RESPONSE"

echo ""
if [ "$HTTPS_RESPONSE" = "200" ] || [ "$HTTPS_RESPONSE" = "303" ] || [ "$HTTPS_RESPONSE" = "301" ]; then
    echo "✨ Tudo configurado!"
    echo ""
    echo "🌐 Acesse: https://192.168.160.9"
    echo "🔑 Keycloak Admin: https://192.168.160.9/auth/admin/"
    echo "   User: admin / Pass: admin"
else
    echo "⚠️  Keycloak ainda pode estar inicializando..."
    echo "💡 Aguarde mais 30 segundos e teste novamente"
    echo "📋 Ver logs: docker logs -f keycloak"
fi
