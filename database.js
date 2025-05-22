// database.js

// 1. Importa o sqlite3 em modo verbose (ajuda no debug)
const sqlite3 = require('sqlite3').verbose();

// 2. Abre (ou cria) o arquivo estoque.db na raiz do projeto
const db = new sqlite3.Database('./estoque.db', err => {
  if (err) {
    console.error('Erro ao abrir/criar o banco de dados:', err.message);
  } else {
    console.log('Banco de dados conectado em estoque.db');
  }
});

// 3. Cria as tabelas se não existirem ainda
db.serialize(() => {
  // Tabela de produtos
  db.run(`
    CREATE TABLE IF NOT EXISTS produtos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL,
      preco_compra REAL NOT NULL,
      preco_venda REAL NOT NULL,
      despesas REAL DEFAULT 0
    )
  `);

  // Tabela de movimentações (entrada e saída)
  db.run(`
    CREATE TABLE IF NOT EXISTS movimentacoes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      produto_id INTEGER,
      tipo TEXT CHECK(tipo IN ('entrada','saida')),
      quantidade INTEGER,
      data_hora DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(produto_id) REFERENCES produtos(id)
    )
  `);
});

// 4. Exporta o objeto db para que o server.js possa usar
module.exports = db;
