const express = require("express");
const http = require("http");
const socketIo = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 3000;
const MAX_JOGADORES = 50;

// Armazenar jogadores conectados
let jogadores = {};
let numeroJogadores = 0;

app.use(express.static("public"));

// Rota principal
app.get("/", (req, res) => {
  res.json({
    servidor: "Sala de Chat Multiplayer com Movimento",
    maxJogadores: MAX_JOGADORES,
    jogadoresOnline: numeroJogadores,
    info: "Conecte via WebSocket em / para entrar na sala"
  });
});

// WebSocket - Conexão de novo jogador
io.on("connection", (socket) => {
  // Verificar limite de jogadores
  if (numeroJogadores >= MAX_JOGADORES) {
    socket.emit("erro", { mensagem: "Sala cheia! Máximo de " + MAX_JOGADORES + " jogadores." });
    socket.disconnect();
    return;
  }

  numeroJogadores++;
  
  // Criar novo jogador
  const id = socket.id;
  jogadores[id] = {
    id,
    nome: "Jogador_" + numeroJogadores,
    x: Math.random() * 800,
    y: Math.random() * 600,
    cor: "#" + Math.floor(Math.random() * 16777215).toString(16)
  };

  console.log("✓ Jogador conectado:", jogadores[id].nome);

  // Enviar lista de jogadores ao novo jogador
  socket.emit("jogadorConectado", jogadores[id]);
  socket.emit("listaJogadores", Object.values(jogadores));

  // Notificar outros jogadores
  socket.broadcast.emit("novoJogador", jogadores[id]);
  io.emit("contagem", { total: numeroJogadores, max: MAX_JOGADORES });

  // Evento: Jogador se moveu
  socket.on("mover", (dados) => {
    if (jogadores[id]) {
      jogadores[id].x = dados.x;
      jogadores[id].y = dados.y;
      
      // Enviar movimento para todos
      io.emit("playerMovimento", {
        id: id,
        x: dados.x,
        y: dados.y
      });
    }
  });

  // Evento: Mensagem de chat
  socket.on("mensagem", (dados) => {
    if (jogadores[id]) {
      io.emit("novaMsg", {
        jogadorId: id,
        nome: jogadores[id].nome,
        cor: jogadores[id].cor,
        mensagem: dados.mensagem,
        timestamp: new Date().toLocaleTimeString()
      });
    }
  });

  // Evento: Jogador desconectar
  socket.on("disconnect", () => {
    if (jogadores[id]) {
      console.log("✗ Jogador desconectado:", jogadores[id].nome);
      delete jogadores[id];
      numeroJogadores--;
      
      // Notificar outros
      socket.broadcast.emit("jogadorSaiu", { id });
      io.emit("contagem", { total: numeroJogadores, max: MAX_JOGADORES });
    }
  });

  // Evento: Renomear jogador
  socket.on("renomear", (dados) => {
    if (jogadores[id] && dados.nome) {
      const nomeAntigo = jogadores[id].nome;
      jogadores[id].nome = dados.nome.substring(0, 20);
      
      io.emit("jogadorRenomeado", {
        id,
        nomeAntigo,
        novoNome: jogadores[id].nome
      });
    }
  });
});

server.listen(PORT, () => {
  console.log("🎮 Servidor de Chat Multiplayer rodando na porta " + PORT);
});
