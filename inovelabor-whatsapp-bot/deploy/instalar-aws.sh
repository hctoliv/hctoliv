#!/usr/bin/env bash
# Instala e liga o atendente IA numa máquina Ubuntu da AWS (EC2).
# Uso, dentro da pasta inovelabor-whatsapp-bot já copiada para o servidor:
#   bash deploy/instalar-aws.sh
set -euo pipefail
cd "$(dirname "$0")/.."

if ! command -v docker >/dev/null; then
  echo ">> Instalando Docker..."
  curl -fsSL https://get.docker.com | sudo sh
  sudo usermod -aG docker "$USER" || true
fi

if [ ! -f .env ]; then
  echo ">> Criando o .env (vai perguntar as chaves)..."
  sudo docker run --rm -it -v "$PWD":/app -w /app node:22-slim sh -c "npm ci --silent && npx tsx src/configurar.ts"
fi

mkdir -p data
echo ">> Construindo a imagem..."
sudo docker build -t inovelabor-bot .
sudo docker rm -f inovelabor-bot >/dev/null 2>&1 || true
echo ">> Ligando o bot (reinicia sozinho se o servidor reiniciar)..."
sudo docker run -d --name inovelabor-bot --restart unless-stopped \
  --env-file .env -e DATA_DIR=/app/data -e PAINEL_PORTA=3000 -p 3000:3000 -v "$PWD/data":/app/data inovelabor-bot

echo ""
IP=$(curl -s --max-time 3 https://checkip.amazonaws.com || echo "IP-DO-SERVIDOR")
echo ">> Painel com QR Code e conversas: http://$IP:3000  (senha: a PAINEL_SENHA do .env)"
echo ">> Pronto. Na primeira vez, escaneie o QR Code (no painel acima ou aqui embaixo)"
echo "   (WhatsApp do número de atendimento > Aparelhos conectados > Conectar aparelho)."
echo "   Para sair desta tela sem desligar o bot: Ctrl+C."
sleep 5
sudo docker logs -f inovelabor-bot
