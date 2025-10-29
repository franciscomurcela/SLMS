#!/bin/bash
# Script para configurar HTTPS no Nginx com certificado auto-assinado

echo " Configurando HTTPS para SLMS..."

PROJECT_DIR=~/rep/group-project-es2526_204

echo " Criando diretório para certificados..."
sudo mkdir -p /etc/nginx/certs

echo " Copiando certificados SSL..."
sudo cp $PROJECT_DIR/nginx-host-config/nginx-selfsigned.crt /etc/nginx/certs/
sudo cp $PROJECT_DIR/nginx-host-config/nginx-selfsigned.key /etc/nginx/certs/

echo " Configurando permissões..."
sudo chmod 644 /etc/nginx/certs/nginx-selfsigned.crt
sudo chmod 600 /etc/nginx/certs/nginx-selfsigned.key

echo " Fazendo backup da configuração antiga..."
if [ -f /etc/nginx/sites-available/slms ]; then
    sudo cp /etc/nginx/sites-available/slms /etc/nginx/sites-available/slms.backup.$(date +%Y%m%d_%H%M%S)
fi

echo " Instalando configuração HTTPS..."
sudo cp $PROJECT_DIR/nginx-host-config/slms-single-origin.conf /etc/nginx/sites-available/slms

if [ ! -L /etc/nginx/sites-enabled/slms ]; then
    sudo ln -s /etc/nginx/sites-available/slms /etc/nginx/sites-enabled/
fi

echo " Testando configuração..."
sudo nginx -t && sudo systemctl reload nginx

echo " HTTPS configurado! Acesso: https://192.168.160.9"
