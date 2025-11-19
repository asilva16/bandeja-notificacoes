import express from 'express';
import http from 'http';
import notificacoesRouter from './notificacoes.js';
import cors from 'cors';
import { initializeDatabase } from './database.js';
import { createSocketServer, startNotificacaoJob } from './websocket-socketio.js';
import { notificarTicketsPendentes } from './tickets-integration.js';


const app = express();
app.use(cors());
const server = http.createServer(app);

app.use(express.json());

app.use('/api/notificacoes', notificacoesRouter);
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString()
  });
});


// Inicializar Socket.io Server
const io = createSocketServer(server);

const PORT = 3000;

// Inicializar banco de dados e depois iniciar servidor
async function startServer() {
  try {
    await initializeDatabase();
    server.listen(PORT, () => {
      console.log(`Servidor rodando em http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Erro ao iniciar servidor:', error);
    process.exit(1);
  }
}




startServer();
startNotificacaoJob(io);

// Chama a verificação de tickets pendentes a cada minuto
setInterval(() => {
  notificarTicketsPendentes(io);
}, 60 * 1000);

export { io };

