#!/bin/bash

# Script de configuração e execução para Math Tug War no Raspberry Pi

# --- Funções Auxiliares ---
log_info() {
  echo "[INFO] $1"
}

log_error() {
  echo "[ERROR] $1" >&2
  exit 1
}

# --- Atualizar o sistema ---
log_info "Atualizando o sistema..."
sudo apt update && sudo apt upgrade -y || log_error "Falha ao atualizar o sistema."

# --- Instalar Python3 e pip --- 
log_info "Verificando e instalando Python3 e pip..."
sudo apt install python3 python3-pip -y || log_error "Falha ao instalar Python3 e pip."

# --- Instalar dependências Python --- 
log_info "Instalando dependências Python (websockets)..."
pip3 install websockets || log_error "Falha ao instalar a dependência 'websockets'."

# --- Configurar diretório da aplicação ---
APP_DIR="/opt/math_tug_war"
log_info "Criando diretório da aplicação em $APP_DIR..."
sudo mkdir -p "$APP_DIR" || log_error "Falha ao criar diretório da aplicação."

log_info "Copiando arquivos da aplicação para $APP_DIR..."
sudo cp -r "$(dirname "$0")"/math_tug_war/* "$APP_DIR" || log_error "Falha ao copiar arquivos da aplicação."

# --- Criar script de inicialização para o serviço (opcional, mas recomendado) ---
log_info "Criando script de inicialização para o serviço..."

SERVICE_SCRIPT="$APP_DIR/start_math_tug_war.sh"
sudo tee "$SERVICE_SCRIPT" > /dev/null << EOF
#!/bin/bash

cd "$APP_DIR"

# Iniciar o servidor WebSocket em segundo plano
python3 server.py &
SERVER_PID_WS=\$!

# Iniciar o servidor HTTP em segundo plano
python3 http_server.py &
SERVER_PID_HTTP=\$!

# Esperar que os processos terminem (ou manter o script rodando)
wait \$SERVER_PID_WS \$SERVER_PID_HTTP
EOF

sudo chmod +x "$SERVICE_SCRIPT" || log_error "Falha ao tornar o script de serviço executável."

log_info "Script de inicialização criado em $SERVICE_SCRIPT."
log_info "Você pode executar a aplicação manualmente com: sudo $SERVICE_SCRIPT"

# --- Criar um serviço systemd para execução automática (opcional) ---
log_info "Criando serviço systemd para iniciar a aplicação automaticamente no boot..."

SYSTEMD_SERVICE_FILE="/etc/systemd/system/math_tug_war.service"
sudo tee "$SYSTEMD_SERVICE_FILE" > /dev/null << EOF
[Unit]
Description=Math Tug War Application
After=network.target

[Service]
ExecStart=/usr/bin/bash $SERVICE_SCRIPT
WorkingDirectory=$APP_DIR
StandardOutput=inherit
StandardError=inherit
Restart=always
User=pi # Altere para o usuário correto se não for 'pi'

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload || log_error "Falha ao recarregar daemon do systemd."
sudo systemctl enable math_tug_war.service || log_error "Falha ao habilitar serviço systemd."
sudo systemctl start math_tug_war.service || log_error "Falha ao iniciar serviço systemd."

log_info "Serviço 'math_tug_war.service' criado e iniciado. A aplicação será iniciada automaticamente no boot."
log_info "Para verificar o status: sudo systemctl status math_tug_war.service"
log_info "Para parar o serviço: sudo systemctl stop math_tug_war.service"
log_info "Para reiniciar o serviço: sudo systemctl restart math_tug_war.service"

log_info "Configuração concluída com sucesso!"
log_info "Acesse a aplicação em http://<IP_DO_SEU_RASPBERRY_PI>:8000"
