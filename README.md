Cabo de Guerra Matemático 🧮🪢

Projeto desenvolvido para o Museu da Imaginação, utilizando um totem touchscreen com dois jogadores competindo simultaneamente em um jogo de matemática.

📖 Sobre o Projeto

O Cabo de Guerra Matemático é um jogo multiplayer local onde dois jogadores resolvem contas matemáticas em seus respectivos dispositivos.

Cada acerto puxa a corda para o lado do jogador que respondeu corretamente.
z
O objetivo é puxar a corda completamente para o seu lado antes do adversário.

🎯 Objetivo Educacional

O projeto foi desenvolvido para estimular:

Raciocínio lógico
Cálculo mental
Agilidade matemática
Competitividade saudável
Trabalho sob pressão
🕹 Fluxo do Jogo
1. Tela de Espera

A aplicação inicia aguardando os dois jogadores.

Exibição:

JOGADOR 1 - AGUARDANDO
JOGADOR 2 - AGUARDANDO

Quando um jogador conecta:

JOGADOR 1 - PRONTO

Após os dois estarem conectados:

INICIANDO PARTIDA...
2. Tela de Tutorial

Exibe as instruções do jogo durante alguns segundos.

Exemplo:

1 - SERÁ EXIBIDA UMA EQUAÇÃO AO SEU LADO
2 - RESOLVA A EQUAÇÃO PARA PUXAR A CORDA
3 - O JOGADOR COM MAIOR PONTUAÇÃO VENCE
3. Partida

Cada jogador recebe uma conta diferente.

Exemplos:

5
x 10
-----
?
18
- 7
-----
?

Quando acertar:

A resposta fica verde
A pontuação aumenta
A corda é puxada

Quando errar:

A resposta fica vermelha
Nenhum ponto é concedido
4. Vitória

Quando a corda ultrapassa o limite definido:

VITÓRIA DA EQUIPE 1

ou

VITÓRIA DA EQUIPE 2

Também é exibido:

PONTUAÇÃO TOTAL

EQUIPE 1
10 PONTOS

EQUIPE 2
4 PONTOS

Após 10 segundos:

Tela de vitória é fechada
Jogo reinicia automaticamente
Retorna para a tela de espera
⚙ Tecnologias Utilizadas
HTML5
CSS3
JavaScript Vanilla

Sem frameworks.

📂 Estrutura do Projeto
/
│
├── assets/
│   ├── ampulheta.gif
│   ├── blackboard.png
│   ├── rope.png
│   ├── rope-background.png
│   ├── tug.png
│   ├── logo.png
│   └── EraserRegular.ttf
│
├── main.html
├── style.css
├── script.js
│
└── README.md
🎨 Assets Utilizados
Fundo Principal
Quadro negro matemático
Fórmulas ao fundo
Tema escolar
Arena
Estrada de terra
Vegetação lateral
Corda central
Interface
Fonte estilo giz escolar
Efeitos de quadro negro
Layout otimizado para totem horizontal
🧠 Operações Matemáticas

Atualmente o sistema gera:

Adição (+)
Subtração (-)
Multiplicação (*)

Exemplos:

15 + 8
20 - 6
7 × 9
🏆 Condição de Vitória

Cada acerto movimenta a corda:

40px

O jogador vence quando atingir:

±400px
🔧 Teste Local

Atalhos atuais para testes:

Tecla	Ação
A	Acerto Jogador 1
Z	Erro Jogador 1
K	Acerto Jogador 2
M	Erro Jogador 2
🚀 Melhorias Futuras
Comunicação real entre celulares
WebSocket
Ranking de jogadores
Sistema de níveis
Divisão
Temporizador por rodada
Efeitos sonoros
Animações de vitória
Integração completa com o totem do museu
👨‍💻 Desenvolvido para

Museu da Imaginação

Projeto educacional interativo focado em matemática, raciocínio lógico e competição saudável através de uma dinâmica inspirada em um clássico cabo de guerra. 🪢🧮🏆
