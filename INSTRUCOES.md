# Instruções de Instalação - Math Tug War no Raspberry Pi

Este documento descreve como usar o script `setup.sh` para instalar e executar a aplicação **Math Tug War** no seu Raspberry Pi.

## O que o script faz?

1.  **Atualiza o sistema:** Executa `sudo apt update` e `sudo apt upgrade`.
2.  **Instala dependências:** Garante que o Python3 e o pip estejam instalados.
3.  **Instala a biblioteca `websockets`:** Necessária para o funcionamento do servidor de jogo.
4.  **Configura o diretório:** Move os arquivos para `/opt/math_tug_war`.
5.  **Cria um serviço systemd:** Configura a aplicação para iniciar automaticamente sempre que o Raspberry Pi for ligado.

## Como usar

1.  Transfira a pasta `math_tug_war` (que contém o `setup.sh` e a subpasta `math_tug_war`) para o seu Raspberry Pi.
2.  Abra o terminal no Raspberry Pi.
3.  Navegue até a pasta onde você colocou os arquivos.
4.  Dê permissão de execução ao script:
    ```bash
    chmod +x setup.sh
    ```
5.  Execute o script:
    ```bash
    ./setup.sh
    ```

## Comandos Úteis

Após a instalação, você pode gerenciar o servidor com os seguintes comandos:

*   **Verificar se o jogo está rodando:**
    ```bash
    sudo systemctl status math_tug_war.service
    ```
*   **Parar o jogo:**
    ```bash
    sudo systemctl stop math_tug_war.service
    ```
*   **Reiniciar o jogo:**
    ```bash
    sudo systemctl restart math_tug_war.service
    ```

## Acessando o Jogo

O jogo estará disponível na rede local através do IP do seu Raspberry Pi na porta 8000.
Exemplo: `http://192.168.1.100:8000`

---
**Nota:** O script assume que o usuário padrão é `pi`. Se você estiver usando outro usuário, edite o arquivo `/etc/systemd/system/math_tug_war.service` após a instalação e altere o campo `User=pi` para o seu nome de usuário.
