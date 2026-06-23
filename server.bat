@echo off
setlocal enabledelayedexpansion

cd /d "%~dp0"

:: Obter IP da máquina
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /i "IPv4"') do (
    set "IP=%%a"
    set "IP=!IP: =!"
    goto :got_ip
)
:got_ip

:: Encerrar processos anteriores do projeto
echo Encerrando processos anteriores...
for /f "tokens=2" %%p in ('tasklist /fi "imagename eq python.exe" /fo list ^| findstr /i "PID"') do (
    taskkill /PID %%p /F >nul 2>&1
)
z
echo.
echo ====================================
echo Servidor iniciado
echo IP: %IP%
echo WebSocket: ws://%IP%:8001
echo HTTP: http://%IP%:8000/
echo ====================================
echo.

:: Iniciar os servidores
start /b python server.py
start /b python http_server.py

:: Manter o script rodando
echo Pressione Ctrl+C para encerrar os servidores.
pause >nul