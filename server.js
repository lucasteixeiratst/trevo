const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Configuração do banco de dados
const pool = new Pool({
  connectionString: process.env.DATABASE_URL, // postgresql://root:YhFjnT3ZhTGF89Oc7TuuA8R9I3WapTnt@dpg-d0r555be5dus73fkf9s0-a.oregon-postgres.render.com/dbtrevopoda
  ssl: { rejectUnauthorized: false }
});

// Testar conexão com o banco ao iniciar
pool.connect((err, client, release) => {
  if (err) {
    console.error('Erro ao conectar ao banco:', err.message);
    return;
  }
  console.log('Conectado ao banco com sucesso');
  release();
});

// Criar tabela servicos
app.post('/create-table', async (req, res) => {
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS servicos (
      id BIGINT PRIMARY KEY,
      endereco VARCHAR(255) NOT NULL,
      numero VARCHAR(50),
      bairro VARCHAR(255),
      tronco VARCHAR(100),
      chave VARCHAR(50),
      qtd INTEGER,
      alimentador VARCHAR(100),
      obs TEXT,
      data TEXT,
      equipe VARCHAR(100),
      matricula VARCHAR(50),
      ea VARCHAR(50),
      servicos TEXT[],
      latitude DECIMAL(9,6),
      longitude DECIMAL(9,6),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;
  try {
    console.log('Executando query para criar tabela...');
    await pool.query(createTableQuery);
    console.log('Tabela criada ou já existente.');
    res.status(201).json({ message: 'Tabela servicos criada com sucesso' });
  } catch (err) {
    console.error('Erro ao criar tabela:', err.message, err.stack);
    res.status(500).json({ error: `Erro ao criar tabela: ${err.message}` });
  }
});

// Visualizar estrutura da tabela
app.get('/table-structure', async (req, res) => {
  const structureQuery = `
    SELECT 
      column_name,
      data_type,
      CASE 
        WHEN is_nullable = 'NO' THEN 'NOT NULL'
        WHEN column_name = 'id' THEN 'PRIMARY KEY'
        ELSE ''
      END AS constraints
    FROM information_schema.columns
    WHERE table_name = 'servicos'
    ORDER BY ordinal_position;
  `;
  try {
    console.log('Consultando estrutura da tabela...');
    const result = await pool.query(structureQuery);
    console.log('Estrutura obtida:', result.rows);
    res.json(result.rows);
  } catch (err) {
    console.error('Erro ao consultar estrutura:', err.message, err.stack);
    res.status(500).json({ error: `Erro ao consultar estrutura: ${err.message}` });
  }
});

// Listar todos os serviços
app.get('/servicos', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM servicos ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    console.error('Erro ao listar serviços:', err.message);
    res.status(500).json({ error: 'Erro ao carregar serviços: ' + err.message });
  }
});

// Salvar um novo serviço
app.post('/servicos', async (req, res) => {
  const {
    id, endereco, numero, bairro, tronco, chave, qtd, alimentador, obs, data, equipe, matricula, ea, servicos, latitude, longitude
  } = req.body;
  try {
    await pool.query(
      `INSERT INTO servicos (id, endereco, numero, bairro, tronco, chave, qtd, alimentador, obs, data, equipe, matricula, ea, servicos, latitude, longitude)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)`,
      [id, endereco, numero, bairro, tronco, chave, qtd, alimentador, obs, data, equipe, matricula, ea, servicos, latitude, longitude]
    );
    res.status(201).json({ message: 'Registro salvo com sucesso' });
  } catch (err) {
    console.error('Erro ao salvar serviço:', err.message);
    res.status(500).json({ error: 'Erro ao salvar: ' + err.message });
  }
});

// Atualizar um serviço
app.put('/servicos/:id', async (req, res) => {
  const { id } = req.params;
  const {
    endereco, numero, bairro, tronco, chave, qtd, alimentador, obs, data, equipe, matricula, ea, servicos, latitude, longitude
  } = req.body;
  try {
    const result = await pool.query(
      `UPDATE servicos SET
         endereco = $1, numero = $2, bairro = $3, tronco = $4, chave = $5, qtd = $6, alimentador = $7, obs = $8,
         data = $9, equipe = $10, matricula = $11, ea = $12, servicos = $13, latitude = $14, longitude = $15
       WHERE id = $16`,
      [endereco, numero, bairro, tronco, chave, qtd, alimentador, obs, data, equipe, matricula, ea, servicos, latitude, longitude, id]
    );
    if (result.rowCount === 0) {
      res.status(404).json({ error: 'Registro não encontrado' });
    } else {
      res.json({ message: 'Registro atualizado com sucesso' });
    }
  } catch (err) {
    console.error('Erro ao atualizar serviço:', err.message);
    res.status(500).json({ error: 'Erro ao atualizar: ' + err.message });
  }
});

// Excluir um serviço
app.delete('/servicos/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM servicos WHERE id = $1', [id]);
    if (result.rowCount === 0) {
      res.status(404).json({ error: 'Registro não encontrado' });
    } else {
      res.json({ message: 'Registro excluído com sucesso' });
    }
  } catch (err) {
    console.error('Erro ao excluir serviço:', err.message);
    res.status(500).json({ error: 'Erro ao excluir: ' + err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
