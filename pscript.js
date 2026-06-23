function getServerHost() {
    let host = localStorage.getItem('serverHost') || '';
    if (!host) {
        if (location && location.hostname) host = location.hostname;
    }
    if (!host) {
        host = prompt('IP do servidor WebSocket (ex: 192.168.0.10):');
        if (host) localStorage.setItem('serverHost', host);
    }
    return host || 'localhost';
}

const WS_HOST = getServerHost();
const socket = new WebSocket("ws://" + WS_HOST + ":8001");
let estado = {};
let isMachineMode = false;
let machineTimer = null;
let machineTimeRemaining = 0;
let machineDifficulty = 'dificil';
let currentMachineAnswer = null;
let playerTimer = null;
let playerTimeRemaining = 0;
let playerDifficulty = 'dificil';
let gameStarted = false;
const RESULT_DISPLAY_DURATION = 10000;
let machineAnswerTimer = null;

// Contadores de acertos para modo máquina
let playerMachineScore = 0;
let machineMachineScore = 0;
const MACHINE_MODE_WIN_SCORE = 5; // Vitória com 5 acertos

let playerNumber = new URLSearchParams(window.location.search).get("player") || ""; if (!playerNumber) {     const pathname = window.location.pathname.toLowerCase();     if (pathname.endsWith("/player1")) {         playerNumber = "1";     } else if (pathname.endsWith("/player2")) {         playerNumber = "2";     }  if (!playerNumber) {     playerNumber = "1"; } if (playerNumber === "1") {     document.body.classList.add("player1-bg"); } else {     document.body.classList.add("player2-bg"); } }

if (!playerNumber) {
    const match = window.location.pathname.match(/player(\d)/i);
    playerNumber = match ? match[1] : "1"; 
}

socket.onmessage = (event) => {
    estado = JSON.parse(event.data);

    // Verifica se há vencedor (fim de jogo no modo PvP)
    if (estado.vencedor && estado.vencedor !== 0) {
        const souVencedor = Number(playerNumber) === Number(estado.vencedor);
        if (typeof window.finalizarPartida === 'function') {
            window.finalizarPartida(souVencedor, estado.placar1, estado.placar2);
        }
    }

    if (typeof window.handlePvPServerState === 'function') {
        window.handlePvPServerState(estado);
    }

    // Verifica se há reset
    if (estado.reset === true) {
        if (typeof window.resetToInitial === 'function') {
            window.resetToInitial();
        } else {
            location.reload();
        }
    }
};

document.addEventListener('DOMContentLoaded', () => {

    const numeroJogador = playerNumber;

    // Elementos de Navegação das Telas
    const mainHeader = document.getElementById('main-header');
    const screenMode = document.getElementById('screen-mode');
    const screenWaiting = document.getElementById('screen-waiting');
    const screenCalculator = document.getElementById('screen-calculator');
    const screenResult = document.getElementById('screen-result');

    // Botões
    const modeButtons = document.querySelectorAll('.mode-btn-img');
    const btnGiveUp = document.getElementById('btn-giveup');

    // Resultado
    const resultMessage = document.getElementById('result-message');
    const finalPoints1 = document.getElementById('final-points-1');
    const finalPoints2 = document.getElementById('final-points-2');

    // Calculadora
    const display = document.getElementById('calc-display');
    const numButtons = document.querySelectorAll('.num-btn');
    const btnClear = document.getElementById('btn-clear');
    const btnEquals = document.getElementById('btn-equals');
    const questionText = document.getElementById('question-text');
    const timerDisplay = document.getElementById('time-remaining');
    const feedbackText = document.getElementById('machine-feedback');

    let currentInput = "0";

    // ==========================
    // TELA MODO
    // ==========================

    modeButtons.forEach(button => {

        button.addEventListener('click', () => {
            isMachineMode = button.id === 'btn-solo';

            if (!isMachineMode) {
                // Modo VERSUS (PvP)
                playerDifficulty = 'dificil';
                socket.send(JSON.stringify({
                    [`player${numeroJogador}Ready`]: true
                }));

                socket.send(JSON.stringify({
                    [`player${numeroJogador}Difficulty`]: 'dificil'
                }));
                resetPlayerTimer();
                gameStarted = false;
                screenWaiting.classList.remove('hidden');
            } else {
                // Modo SOLO (contra máquina)
                startMachineMode('dificil');
                screenCalculator.classList.remove('hidden');
            }

            screenMode.classList.add('hidden');
            mainHeader.classList.add('hidden');

        });

    });

    btnGiveUp?.addEventListener('click', () => {
        giveUp();
    });

    // ==========================
    // CALCULADORA
    // ==========================

    function updateDisplay() {
        display.textContent = currentInput || "0";
    }

    function startMachineMode(dificuldade) {
        machineDifficulty = dificuldade;
        playerMachineScore = 0;
        machineMachineScore = 0;
        feedbackText.textContent = '';
        nextMachineQuestion();
    }

    function startPlayerTimer(dificuldade) {
        playerDifficulty = dificuldade;
        resetPlayerTimer();
        playerTimeRemaining = 30; // 30 segundos para o jogador
        updatePlayerTimer();

        playerTimer = setInterval(() => {
            playerTimeRemaining -= 1;
            updatePlayerTimer();

            if (playerTimeRemaining <= 0) {
                resetPlayerTimer();
                feedbackText.textContent = 'TEMPO ESGOTADO!';
                currentInput = '';

                if (socket.readyState === WebSocket.OPEN) {
                    socket.send(JSON.stringify({
                        [`player${playerNumber}Timeout`]: true,
                        [`player${playerNumber}Resposta`]: ""
                    }));
                }
            }
        }, 1000);
    }

    function resetPlayerTimer() {
        if (playerTimer) {
            clearInterval(playerTimer);
            playerTimer = null;
        }
        playerTimeRemaining = 0;
        timerDisplay.textContent = '00';
    }

    function updatePlayerTimer() {
        timerDisplay.textContent = playerTimeRemaining
            .toString()
            .padStart(2, '0');
    }

    function handlePvPServerState(state) {
        if (isMachineMode) {
            return;
        }

        const novaPergunta = state[`equacao${playerNumber}`] || '';
        const dificuldadeRemota = state[`player${playerNumber}Difficulty`] || playerDifficulty;

        if (dificuldadeRemota && dificuldadeRemota !== playerDifficulty) {
            playerDifficulty = dificuldadeRemota;
        }

        const isWaiting = !screenWaiting.classList.contains('hidden');
        if (novaPergunta && (isWaiting || novaPergunta !== questionText.textContent)) {
            questionText.textContent = novaPergunta;
            feedbackText.textContent = '';
            gameStarted = true;
            screenWaiting.classList.add('hidden');
            screenCalculator.classList.remove('hidden');
            resetPlayerTimer();
            startPlayerTimer(playerDifficulty);
        }
    }

    window.handlePvPServerState = handlePvPServerState;

    function showModeSelectionScreen() {
        screenCalculator.classList.add('hidden');
        screenWaiting.classList.add('hidden');
        screenResult.classList.add('hidden');

        mainHeader.classList.remove('hidden');
        screenMode.classList.remove('hidden');

        currentInput = "0";
        updateDisplay();
        resetPlayerTimer();
        machineTimeRemaining = 0;
        timerDisplay.textContent = '00';
        feedbackText.textContent = '';
        questionText.textContent = 'RESOLVA A EQUAÇÃO';
        finalPoints1.textContent = '00';
        finalPoints2.textContent = '00';
        resultMessage.className = 'result-title';
        resultMessage.textContent = '';
    }

    function goBackToModeSelection() {
        if (!isMachineMode) {
            socket.send(JSON.stringify({
                [`player${numeroJogador}Ready`]: false,
                [`player${numeroJogador}Resposta`]: "",
                [`player${numeroJogador}Timeout`]: false
            }));
        }

        isMachineMode = false;
        gameStarted = false;
        
        // Limpa timers da máquina
        if (machineTimer) {
            clearInterval(machineTimer);
            machineTimer = null;
        }
        if (machineAnswerTimer) {
            clearTimeout(machineAnswerTimer);
            machineAnswerTimer = null;
        }
        
        showModeSelectionScreen();
    }

    function giveUp() {
        if (!isMachineMode) {
            const vencedor = numeroJogador === '1' ? 2 : 1;
            
            // Oculta a calculadora imediatamente
            screenCalculator.classList.add('hidden');
            screenWaiting.classList.add('hidden');
            
            socket.send(JSON.stringify({
                desistencia: Number(numeroJogador),
                vencedor: vencedor,
                player1Ready: false,
                player2Ready: false,
                player1Timeout: false,
                player2Timeout: false
            }));
            feedbackText.textContent = 'VOCÊ DESISTIU!';
        } else {
            goBackToModeSelection();
        }
    }

    function nextMachineQuestion() {
        const conta = gerarConta(machineDifficulty);
        questionText.textContent = conta.texto;
        currentMachineAnswer = conta.resposta;
        currentInput = '';
        updateDisplay();
        feedbackText.textContent = '';
        resetMachineTimer();
        machineTimeRemaining = 30; // 30 segundos para o jogador
        updateMachineTimer();
        
        machineTimer = setInterval(() => {
            machineTimeRemaining -= 1;
            updateMachineTimer();
            if (machineTimeRemaining <= 0) {
                clearInterval(machineTimer);
                machineTimer = null;
                feedbackText.textContent = 'TEMPO ESGOTADO!';
                setTimeout(nextMachineQuestion, 1000);
            }
        }, 1000);
        
        // IA responde após ~20 segundos
        startMachineAnswer();
    }

    function startMachineAnswer() {
        // Limpa timer anterior se existir
        if (machineAnswerTimer) {
            clearTimeout(machineAnswerTimer);
        }
        
        // Gera um delay entre 18 e 22 segundos
        const delayMs = (18 + Math.random() * 4) * 1000;
        
        machineAnswerTimer = setTimeout(() => {
            submitMachineAnswer();
        }, delayMs);
    }

    function resetMachineTimer() {
        if (machineTimer) {
            clearInterval(machineTimer);
            machineTimer = null;
        }
    }

    function updateMachineTimer() {
        timerDisplay.textContent = machineTimeRemaining
            .toString()
            .padStart(2, '0');
    }

    function submitMachineAnswer() {
        // A máquina sempre acerta
        machineMachineScore++;
        feedbackText.textContent = `MÁQUINA ACERTOU! (${machineMachineScore}/${MACHINE_MODE_WIN_SCORE})`;
        
        // Verifica se a máquina venceu
        if (machineMachineScore >= MACHINE_MODE_WIN_SCORE) {
            resetMachineTimer();
            setTimeout(() => {
                finalizarPartidaMaquina(false, playerMachineScore, machineMachineScore);
            }, 1500);
            return;
        }
        
        // Aguarda um pouco antes de passar para a próxima pergunta
        resetMachineTimer();
        setTimeout(nextMachineQuestion, 1500);
    }

    function gerarConta(dificuldade = 'dificil') {
        // Sempre gera contas compostas (modo difícil)
        const op1 = ['+', '-'][Math.floor(Math.random() * 2)];
        const op2 = ['+', '-'][Math.floor(Math.random() * 2)];
        const n1 = Math.floor(Math.random() * 30) + 10;
        const n2 = Math.floor(Math.random() * 20) + 5;
        const n3 = Math.floor(Math.random() * 10) + 1;
        let res_calc = op1 === '+' ? n1 + n2 : n1 - n2;
        res_calc = op2 === '+' ? res_calc + n3 : res_calc - n3;
        texto = `${n1} ${op1} ${n2} ${op2} ${n3}`;
        html = `<div class="conta-horizontal">${texto}</div>`;
        return { texto: texto, resposta: res_calc, html: html };
    }

    // Botões numéricos com imagens
    const imgNumButtons = document.querySelectorAll('.calc-img-btn[data-number]');
    imgNumButtons.forEach(button => {
        button.addEventListener('click', () => {
            const number = button.getAttribute('data-number');
            
            if (currentInput === "0" && number === "0") return;
            
            if (currentInput === "0")
                currentInput = "";
            
            currentInput += number;
            updateDisplay();
        });
    });
    
    // Manter compatibilidade com botões de texto (se houver)
    numButtons.forEach(button => {
        button.addEventListener('click', () => {
            if (
                currentInput === "0" &&
                button.textContent === "0"
            ) return;

            if (currentInput === "0")
                currentInput = "";

            currentInput +=
                button.textContent;

            updateDisplay();
        });
    });

    btnClear.addEventListener('click', () => {

        currentInput =
            currentInput.slice(0, -1);

        updateDisplay();

    });

    // ==========================
    // ENVIAR RESPOSTA
    // ==========================

    btnEquals.addEventListener('click', () => {
        if (isMachineMode) {
            // Modo máquina - verifica a resposta do jogador
            const respostaJogador = Number(currentInput);
            const acertou = respostaJogador === Number(currentMachineAnswer);
            
            resetMachineTimer();
            
            if (acertou) {
                playerMachineScore++;
                feedbackText.textContent = `VOCÊ ACERTOU! (${playerMachineScore}/${MACHINE_MODE_WIN_SCORE})`;
                
                // Verifica se o jogador venceu
                if (playerMachineScore >= MACHINE_MODE_WIN_SCORE) {
                    currentInput = "";
                    updateDisplay();
                    setTimeout(() => {
                        finalizarPartidaMaquina(true, playerMachineScore, machineMachineScore);
                    }, 1500);
                    return;
                }
            } else {
                feedbackText.textContent = `ERRADO! A resposta era ${currentMachineAnswer}`;
            }
            
            currentInput = "";
            updateDisplay();
            
            // Passa para a próxima pergunta após 1.5 segundos
            setTimeout(nextMachineQuestion, 1500);
        } else {
            // Modo PvP
            resetPlayerTimer();
            socket.send(JSON.stringify({
                [`player${numeroJogador}Resposta`]: currentInput
            }));
            currentInput = "";
            updateDisplay();
        }

    });

    // ==========================
    // RESULTADO
    // ==========================

    function finalizarPartidaMaquina(isVitoria, pontosJogador, pontosMaquina) {
        // Oculta a calculadora
        screenCalculator.classList.add('hidden');
        screenWaiting.classList.add('hidden');

        if (isVitoria) {
            resultMessage.textContent = "VOCÊ VENCEU, PARABÉNS!";
            resultMessage.className = "result-title text-win";
        } else {
            resultMessage.textContent = "VOCÊ PERDEU!";
            resultMessage.className = "result-title text-lose";
        }

        finalPoints1.textContent = pontosJogador.toString().padStart(2, '0');
        finalPoints2.textContent = pontosMaquina.toString().padStart(2, '0');

        screenResult.classList.remove('hidden');

        // Retorna à tela inicial após o tempo de exibição
        setTimeout(() => {
            resetToInitial();
        }, RESULT_DISPLAY_DURATION);
    }

    function finalizarPartida(
        isVitoria,
        pontosEquipe1,
        pontosEquipe2
    ){
        // Oculta a calculadora
        screenCalculator.classList.add('hidden');
        screenWaiting.classList.add('hidden');

        if (isVitoria){
            resultMessage.textContent = "VOCÊ VENCEU, PARABÉNS!";
            resultMessage.className = "result-title text-win";
        }else{
            resultMessage.textContent = "VOCÊ PERDEU!";
            resultMessage.className = "result-title text-lose";
        }

        finalPoints1.textContent = pontosEquipe1.toString().padStart(2,'0');
        finalPoints2.textContent = pontosEquipe2.toString().padStart(2,'0');

        screenResult.classList.remove('hidden');

        if (!isMachineMode) {
            setTimeout(() => {
                resetToInitial();
                if (socket.readyState === WebSocket.OPEN) {
                    socket.send(JSON.stringify({ reset: true }));
                }
            }, RESULT_DISPLAY_DURATION);
        }
    }

    window.finalizarPartida = finalizarPartida;

    function resetToInitial(){
        isMachineMode = false;
        gameStarted = false;
        playerDifficulty = 'dificil';
        playerMachineScore = 0;
        machineMachineScore = 0;
        
        // Limpa timers
        if (machineTimer) {
            clearInterval(machineTimer);
            machineTimer = null;
        }
        if (machineAnswerTimer) {
            clearTimeout(machineAnswerTimer);
            machineAnswerTimer = null;
        }
        if (playerTimer) {
            clearInterval(playerTimer);
            playerTimer = null;
        }
        
        showModeSelectionScreen();
    }

    window.resetToInitial = resetToInitial;
});
