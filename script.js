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
let resultadoMostrado = false;
let timeout1Processed = false;
let timeout2Processed = false;
const RESULT_DISPLAY_DURATION = 10000;

// TIMER - Variáveis globais
let gameTimerInterval = null;
let timeLeft = 180; // 3 minutos em segundos
let isGameRunning = false;

socket.onmessage = (event) => {
    const novoEstado = JSON.parse(event.data);

    if (novoEstado.player1Timeout && !timeout1Processed) {
        timeout1Processed = true;
        handlePlayerTimeout(1);
    }
    if (!novoEstado.player1Timeout) {
        timeout1Processed = false;
    }

    if (novoEstado.player2Timeout && !timeout2Processed) {
        timeout2Processed = true;
        handlePlayerTimeout(2);
    }
    if (!novoEstado.player2Timeout) {
        timeout2Processed = false;
    }

    // Verifica se há vencedor
    if (novoEstado.vencedor && novoEstado.vencedor !== 0 && !resultadoMostrado) {
        resultadoMostrado = true;
        mostrarVitoria(novoEstado.vencedor);
    }

    // Verifica se há desistência
    if (novoEstado.desistencia && novoEstado.desistencia !== 0 && !novoEstado.vencedor && !resultadoMostrado) {
        resultadoMostrado = true;
        const vencedor = novoEstado.desistencia === 1 ? 2 : 1;
        mostrarVitoria(vencedor);
    }

    // Verifica se há reset
    if (novoEstado.reset === true && resultadoMostrado) {
        reiniciarPartida();
    }

    estado = novoEstado;
};

let player1TimeoutActive = false;
let player2TimeoutActive = false;
let jogoIniciado = false;
let esperaOutraEquipeTimer = null;

// Loop para verificar se os jogadores estão prontos
setInterval(verificarJogadores, 500);

function verificarJogadores(){
    const jogador1Pronto = estado.player1Ready === true || estado.player1Ready === "true";
    const jogador2Pronto = estado.player2Ready === true || estado.player2Ready === "true";

    if(jogador1Pronto){
        document.getElementById("player1").textContent = "JOGADOR 1 - PRONTO";
    }

    if(jogador2Pronto){
        document.getElementById("player2").textContent = "JOGADOR 2 - PRONTO";
    }

    if(jogador1Pronto !== jogador2Pronto && !jogoIniciado && !esperaOutraEquipeTimer){
        esperaOutraEquipeTimer = setTimeout(() => {
            if(!(estado.player1Ready && estado.player2Ready)){
                location.reload();
            }
        },10000);
    }

    if(
        jogador1Pronto &&
        jogador2Pronto &&
        !jogoIniciado
    ){
        clearTimeout(esperaOutraEquipeTimer);
        esperaOutraEquipeTimer = null;
        iniciarFluxoJogo();
    }
}

function iniciarFluxoJogo(){
    jogoIniciado = true;
    document.getElementById("player1").textContent = "INICIANDO PARTIDA...";
    document.getElementById("player2").textContent = "INICIANDO PARTIDA...";

    setTimeout(() => {
        document.getElementById("tela-espera").classList.add("hidden");
        document.body.classList.add("partida-iniciada");
        document.getElementById("tela-tutorial").classList.remove("hidden");

        setTimeout(() => {
            document.getElementById("tela-tutorial").classList.add("hidden");
            document.getElementById("tela-jogo").classList.remove("hidden");

            iniciarJogo();
        }, 8000);
    }, 3000);
}

// ============================================
// TIMER - REFEITO DO ZERO
// ============================================
function iniciarTimerPartida() {
    // Limpa qualquer timer anterior
    if (gameTimerInterval) {
        clearInterval(gameTimerInterval);
        gameTimerInterval = null;
    }

    // Reseta o tempo para 180 segundos (3 minutos)
    timeLeft = 180;
    isGameRunning = true;

    // Atualiza a exibição inicial
    atualizarDisplayTimer();

    // Cria um intervalo que decrementa 1 segundo a cada 1000ms
    gameTimerInterval = setInterval(() => {
        if (!isGameRunning) {
            clearInterval(gameTimerInterval);
            gameTimerInterval = null;
            return;
        }

        // Decrementa o tempo
        timeLeft--;

        // Atualiza a exibição
        atualizarDisplayTimer();

        // Verifica se o tempo acabou
        if (timeLeft <= 0) {
            // Para o timer
            isGameRunning = false;
            clearInterval(gameTimerInterval);
            gameTimerInterval = null;

            // Determina o vencedor baseado nos pontos
            if (pontosJogador1 > pontosJogador2) {
                finalizarJogo(1);
            } else if (pontosJogador2 > pontosJogador1) {
                finalizarJogo(2);
            } else {
                finalizarJogo(0); // Empate
            }
        }
    }, 1000); // Atualiza a cada 1 segundo
}

function atualizarDisplayTimer() {
    // Calcula minutos e segundos
    const minutos = Math.floor(timeLeft / 60);
    const segundos = timeLeft % 60;

    // Formata com zeros à esquerda
    const minutosStr = String(minutos).padStart(2, '0');
    const segundosStr = String(segundos).padStart(2, '0');

    // Atualiza o elemento HTML
    const timerElement = document.getElementById("game-timer");
    if (timerElement) {
        timerElement.innerHTML = `🕒 <span>${minutosStr}:${segundosStr}</span>`;

        if(timeLeft <= 30){
            timerElement.classList.add("ending");
        }else{
            timerElement.classList.remove("ending");
        }
    }
}

function pararTimer() {
    if (gameTimerInterval) {
        clearInterval(gameTimerInterval);
        gameTimerInterval = null;
    }
    isGameRunning = false;
}

// ============================================
// ELEMENTOS DA INTERFACE
// ============================================
const equacao1 = document.getElementById("equacao1");
const equacao2 = document.getElementById("equacao2");
const resposta1 = document.getElementById("resposta1");
const resposta2 = document.getElementById("resposta2");
const rope = document.getElementById("rope");
const ropeWrapper = document.getElementById("ropeWrapper");
const score1 = document.getElementById("score1");
const score2 = document.getElementById("score2");

// ============================================
// ESTADO DO JOGO
// ============================================
let ropePosition = 0;
let pontosJogador1 = 0;
let pontosJogador2 = 0;
let errosJogador1 = 0;
let errosJogador2 = 0;
const DIFERENCA_VITORIA = 5;
let respostaCorreta1 = 0;
let respostaCorreta2 = 0;
const MAX_ACERTOS = 15;

// ============================================
// GERADOR DE CONTAS - APENAS MODO DIFÍCIL
// ============================================
function novaQuestaoJogador1() {
    const conta = gerarConta('dificil');
    respostaCorreta1 = conta.resposta;
    equacao1.innerHTML = conta.html;

    socket.send(JSON.stringify({
        equacao1: conta.texto
    }));

    resposta1.textContent = "";
    resposta1.className = "resultado";
}

function novaQuestaoJogador2() {
    const conta = gerarConta('dificil');
    respostaCorreta2 = conta.resposta;
    equacao2.innerHTML = conta.html;

    socket.send(JSON.stringify({
        equacao2: conta.texto
    }));

    resposta2.textContent = "";
    resposta2.className = "resultado";
}

function gerarConta(dificuldade = 'dificil') {
while(true){
const op = ['+','-'][Math.floor(Math.random()*2)];

const n1 = Math.floor(Math.random()*30) + 10;
const n2 = Math.floor(Math.random()*20) + 5;

const res = op === '+'
    ? n1 + n2
    : n1 - n2;

if (res <= 0) continue;

return {
    texto: `${n1} ${op} ${n2}`,
    resposta: res,
    html: `<div class="conta-horizontal">${n1} ${op} ${n2}</div>`
};
}
}

// ============================================
// MOVIMENTO DA CORDA
// ============================================
function atualizarCorda() {
    rope.style.transform = `translate(calc(-50% + ${ropePosition}px), -50%)`;
    rope.classList.remove('puxando');
    void rope.offsetWidth; // força o navegador a "resetar" a animação
    rope.classList.add('puxando');
    verificarVitoria();
}

function verificarVitoria() {
    // Vitória por 15 acertos
    if (pontosJogador1 >= MAX_ACERTOS) {
        finalizarJogo(1);
        return;
    }
    if (pontosJogador2 >= MAX_ACERTOS) {
        finalizarJogo(2);
        return;
    }

    // Vitória por diferença de 5
    const diferenca = Math.abs(pontosJogador1 - pontosJogador2);
    if (diferenca >= DIFERENCA_VITORIA) {
        if (pontosJogador1 > pontosJogador2) {
            finalizarJogo(1);
        } else {
            finalizarJogo(2);
        }
    }
}

// ============================================
// PROCESSAMENTO DAS RESPOSTAS
// ============================================
function responderJogador1(resposta) {
    if (Number(resposta) === Number(respostaCorreta1)) {
        pontosJogador1++;
        score1.textContent = `JOGADOR 1 - ${pontosJogador1}`;
        resposta1.textContent = respostaCorreta1;
        resposta1.className = "resultado certo";
        ropePosition -= 80;
        atualizarCorda();
    } else {
        errosJogador1++;
        resposta1.textContent = `${resposta} ✖`;
        resposta1.className = "resultado errado";
    }

    setTimeout(() => {
        novaQuestaoJogador1();
    }, 1500);
}

function responderJogador2(resposta) {
    if (Number(resposta) === Number(respostaCorreta2)) {
        pontosJogador2++;
        score2.textContent = `JOGADOR 2 - ${pontosJogador2}`;
        resposta2.textContent = respostaCorreta2;
        resposta2.className = "resultado certo";
        ropePosition += 80;
        atualizarCorda();
    } else {
        errosJogador2++;
        resposta2.textContent = `${resposta} ✖`;
        resposta2.className = "resultado errado";
    }

    setTimeout(() => {
        novaQuestaoJogador2();
    }, 1500);
}

function iniciarJogo() {
    console.log("Iniciando jogo...");
    
    ropePosition = 0;
    pontosJogador1 = 0;
    pontosJogador2 = 0;
    errosJogador1 = 0;
    errosJogador2 = 0;

    score1.textContent = "JOGADOR 1 - 0";
    score2.textContent = "JOGADOR 2 - 0";
    document.body.classList.remove("partida-iniciada");
    rope.style.transform = "translate(-50%, -50%)";

    resposta1.textContent = "";
    resposta2.textContent = "";
    resposta1.className = "resultado";
    resposta2.className = "resultado";

    // Inicia o timer
    iniciarTimerPartida();
    console.log("Timer iniciado com 180 segundos");

    novaQuestaoJogador1();
    novaQuestaoJogador2();
}

function handlePlayerTimeout(playerNumber) {
    const resposta = playerNumber === 1 ? resposta1 : resposta2;
    resposta.textContent = '⏱';
    resposta.className = 'resultado timeout';

    setTimeout(() => {
        if (playerNumber === 1) {
            novaQuestaoJogador1();
            if (socket.readyState === WebSocket.OPEN) {
                socket.send(JSON.stringify({ player1Timeout: false }));
            }
        } else {
            novaQuestaoJogador2();
            if (socket.readyState === WebSocket.OPEN) {
                socket.send(JSON.stringify({ player2Timeout: false }));
            }
        }
    }, 1500);
}

// ============================================
// FINALIZAR JOGO
// ============================================
function finalizarJogo(vencedor) {
    // Evita múltiplas chamadas
    if (resultadoMostrado) return;
    resultadoMostrado = true;

    // Para o timer
    pararTimer();

    // Mostra o popup de vitória
    mostrarVitoria(vencedor);
}

function mostrarVitoria(vencedor){
    if (resultadoMostrado && document.getElementById("popup-vitoria").classList.contains("hidden") === false) {
        return; // Já está mostrando
    }

    document.getElementById("popup-vitoria").classList.remove("hidden");
    
    if (vencedor === 0) {
        document.getElementById("titulo-vitoria").textContent = `EMPATE!`;
    } else {
        document.getElementById("titulo-vitoria").textContent = `VITÓRIA DA EQUIPE ${vencedor}`;
    }
    
    document.getElementById("final1").textContent = `${pontosJogador1} ACERTOS`;
    document.getElementById("final2").textContent = `${pontosJogador2} ACERTOS`;
    document.getElementById("erros1").textContent = `${errosJogador1} ERROS`;
    document.getElementById("erros2").textContent = `${errosJogador2} ERROS`;

    // Sincroniza o fim de jogo com os controles
    socket.send(JSON.stringify({
        vencedor: vencedor,
        placar1: pontosJogador1,
        placar2: pontosJogador2,
        erros1: errosJogador1,
        erros2: errosJogador2,
        player1Timeout: false,
        player2Timeout: false,
        desistencia: 0
    }));

    setTimeout(() => {
        reiniciarPartida();
    }, RESULT_DISPLAY_DURATION);
}

function reiniciarPartida(){
    document.getElementById("popup-vitoria").classList.add("hidden");
    document.getElementById("tela-jogo").classList.add("hidden");
    document.getElementById("tela-espera").classList.remove("hidden");

    jogoIniciado = false;
    resultadoMostrado = false;

    // Para o timer
    pararTimer();

    // Reseta o estado
    socket.send(JSON.stringify({
        player1Ready: false,
        player2Ready: false,
        player1Resposta: "",
        player2Resposta: "",
        vencedor: 0,
        desistencia: 0,
        reset: true
    }));

    ropePosition = 0;
    pontosJogador1 = 0;
    pontosJogador2 = 0;

    document.getElementById("player1").textContent = "JOGADOR 1 - AGUARDANDO";
    document.getElementById("player2").textContent = "JOGADOR 2 - AGUARDANDO";

    rope.style.transform = "translate(-50%, -50%)";
}

// ============================================
// ESCUTA CONTÍNUA DE RESPOSTAS
// ============================================
setInterval(() => {
    const player1TimeoutActive = estado.player1Timeout === true || estado.player1Timeout === "true";
    const player2TimeoutActive = estado.player2Timeout === true || estado.player2Timeout === "true";

    if (!player1TimeoutActive && estado.player1Resposta && estado.player1Resposta !== "") {
        responderJogador1(estado.player1Resposta);
        estado.player1Resposta = "";
        socket.send(JSON.stringify({ player1Resposta: "" }));
    }

    if (!player2TimeoutActive && estado.player2Resposta && estado.player2Resposta !== "") {
        responderJogador2(estado.player2Resposta);
        estado.player2Resposta = "";
        socket.send(JSON.stringify({ player2Resposta: "" }));
    }
}, 100);
