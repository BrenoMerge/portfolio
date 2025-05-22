const express = require('express');
const path = require('path');
const db = require('./database');

const app = express();
const PORT = 3000;

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

app.get('/api/produtos', (req, res) => {
  db.all('SELECT * FROM produtos', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/api/produtos', (req, res) => {
  const { nome, preco_compra, preco_venda, despesas } = req.body;
  db.run(
    `INSERT INTO produtos (nome, preco_compra, preco_venda, despesas) VALUES (?, ?, ?, ?)`,
    [nome, preco_compra, preco_venda, despesas || 0],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: this.lastID });
    }
  );
});

app.post('/api/movimentacoes', (req, res) => {
  const { produto_id, tipo, quantidade } = req.body;
  db.run(
    `INSERT INTO movimentacoes (produto_id, tipo, quantidade) VALUES (?, ?, ?)`,
    [produto_id, tipo, quantidade],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: this.lastID });
    }
  );
});

app.get('/api/estoque', (req, res) => {
  const sql = `
    SELECT 
      p.id, 
      p.nome,
      COALESCE(SUM(CASE WHEN m.tipo = 'entrada' THEN m.quantidade ELSE 0 END), 0) -
      COALESCE(SUM(CASE WHEN m.tipo = 'saida' THEN m.quantidade ELSE 0 END), 0) AS quantidade_em_estoque
    FROM produtos p
    LEFT JOIN movimentacoes m ON p.id = m.produto_id
    GROUP BY p.id
  `;
  db.all(sql, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
