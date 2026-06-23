import asyncio
import json
import websockets

clientes = set()

estado = {
    "player1Ready": False,
    "player2Ready": False,

    "player1Difficulty": "",
    "player2Difficulty": "",

    "player1Resposta": "",
    "player2Resposta": "",

    "player1Timeout": False,
    "player2Timeout": False,
z
    "equacao1": "",
    "equacao2": "",

    "vencedor": 0,
    "desistencia": 0,

    "placar1": 0,
    "placar2": 0
}
# Compatibilidade com diferentes versões do websockets: handler recebe (websocket, path)
async def handler(websocket, path=None):

    clientes.add(websocket)

    try:
        async for mensagem in websocket:

            try:
                dados = json.loads(mensagem)
            except json.JSONDecodeError:
                # Ignora mensagens inválidas
                print("Mensagem JSON inválida recebida:", mensagem)
                continue

            # Detecta se é um reset explícito enviado pelo controlador
            reset_flag = bool(dados.get('reset', False))

            # Atualiza o estado compartilhado com os dados recebidos
            estado.update(dados)

            if reset_flag:
                estado.update({
                    "player1Ready": False,
                    "player2Ready": False,
                    "player1Difficulty": "",
                    "player2Difficulty": "",
                    "player1Resposta": "",
                    "player2Resposta": "",
                    "player1Timeout": False,
                    "player2Timeout": False,
                    "equacao1": "",
                    "equacao2": "",
                    "desistencia": 0,
                    "vencedor": 0,
                    "placar1": 0,
                    "placar2": 0
                })

            resposta = json.dumps(estado)

            # Envia o estado atualizado para todos os clientes conectados
            for cliente in clientes.copy():
                try:
                    await cliente.send(resposta)
                except Exception as e:
                    # Se o envio falhar (cliente desconectado), remove com segurança
                    print("Erro ao enviar para cliente, removendo:", e)
                    clientes.discard(cliente)

            # Se foi um reset, limpa a flag para não ficar disparando resets contínuos
            if reset_flag:
                estado['reset'] = False

    finally:
        # Remove o websocket conectado com segurança (sem KeyError)
        clientes.discard(websocket)

async def main():

    async with websockets.serve(
        handler,
        "0.0.0.0",
        8001
    ):
        print("Servidor iniciado em ws://0.0.0.0:8001")

        await asyncio.Future()

asyncio.run(main())