const express = require("express");
const app = express();

const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// Simular um banco de dados com personagens
let personagens = {};

// GET - Listar todos os personagens
app.get("/personagens", (req, res) => {
  res.json(personagens);
});

// GET - Obter um personagem específico
app.get("/personagens/:id", (req, res) => {
  const { id } = req.params;
  if (personagens[id]) {
    res.json(personagens[id]);
  } else {
    res.status(404).json({ erro: "Personagem não encontrado" });
  }
});

// POST - Criar novo personagem
app.post("/personagens", (req, res) => {
  const { nome, classe } = req.body;
  
  if (!nome || !classe) {
    return res.status(400).json({ erro: "Nome e classe são obrigatórios" });
  }
  
  const id = Date.now().toString();
  personagens[id] = {
    id,
    nome,
    classe,
    x: 0,
    y: 0,
    hp: 100,
    velocidade: 5,
    criado_em: new Date()
  };
  
  res.status(201).json(personagens[id]);
});

// PUT - Mover personagem
app.put("/personagens/:id/mover", (req, res) => {
  const { id } = req.params;
  const { x, y } = req.body;
  
  if (!personagens[id]) {
    return res.status(404).json({ erro: "Personagem não encontrado" });
  }
  
  if (x !== undefined) personagens[id].x = x;
  if (y !== undefined) personagens[id].y = y;
  
  res.json(personagens[id]);
});

// PUT - Atacar/Danificar personagem
app.put("/personagens/:id/danificar", (req, res) => {
  const { id } = req.params;
  const { dano } = req.body;
  
  if (!personagens[id]) {
    return res.status(404).json({ erro: "Personagem não encontrado" });
  }
  
  personagens[id].hp -= dano || 10;
  if (personagens[id].hp < 0) personagens[id].hp = 0;
  
  res.json(personagens[id]);
});

// DELETE - Remover personagem
app.delete("/personagens/:id", (req, res) => {
  const { id } = req.params;
  
  if (!personagens[id]) {
    return res.status(404).json({ erro: "Personagem não encontrado" });
  }
  
  delete personagens[id];
  res.json({ mensagem: "Personagem removido" });
});

// Rota raiz
app.get("/", (req, res) => {
  res.json({
    servidor: "Game de Controle de Personagem",
    endpoints: {
      "GET /personagens": "Listar todos os personagens",
      "GET /personagens/:id": "Obter um personagem específico",
      "POST /personagens": "Criar novo personagem (nome, classe)",
      "PUT /personagens/:id/mover": "Mover personagem (x, y)",
      "PUT /personagens/:id/danificar": "Aplicar dano ao personagem (dano)",
      "DELETE /personagens/:id": "Remover personagem"
    }
  });
});

app.listen(PORT, () => {
  console.log("Servidor de Game rodando na porta " + PORT);
});
