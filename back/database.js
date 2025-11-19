import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

// Configuração do banco de dados
const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

// Criar pool de conexões
const pool = mysql.createPool(dbConfig);

// Função para inicializar o banco 
export async function initializeDatabase() {
  try {
    const connection = await pool.getConnection();  
    console.log('Banco de dados inicializado com sucesso!');
    connection.release();
  } catch (error) {
    console.error('Erro ao inicializar banco de dados:', error);
    throw error;
  }
}

// Função para executar queries com tratamento de erro e retry para lock timeout
export async function executeQuery(query, params = [], maxRetries = 3) {
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const [results] = await pool.execute(query, params);
      return results;
    } catch (error) {
      lastError = error;
      
      // Se for lock timeout, tenta novamente após um delay
      if (error.code === 'ER_LOCK_WAIT_TIMEOUT' && attempt < maxRetries) {
        const delay = Math.pow(2, attempt) * 100; // Backoff exponencial: 200ms, 400ms, 800ms
        console.warn(`Lock timeout na tentativa ${attempt}, tentando novamente em ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      
      // Para outros erros ou última tentativa, lança o erro
      console.error('Erro na query:', error);
      throw error;
    }
  }
  
  // Se chegou aqui, todas as tentativas falharam
  throw lastError;
}

export default pool; 