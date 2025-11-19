import axios from 'axios';
import { enviarParaSetores } from './websocket-socketio.js';

// Configurações da API
const CONFIG = {
  baseURL: 'https://api-contabilitasig.zappycontabil.chat/api',
  endpoint: '/tickets',
  token: '19548d1216b4dd60e313cb459bbafc08b20970fab7401a6897cb60252a41502c5fa08178b78e83a3add15a1294f7e1c744f96e726315ff40d938a84850b0689579c0fd09f8c18998287b789e897035501e34e074ae6a343fd3cef3a7910f6170045f2975e8c2974594e324fe48a6c606b34da879397e1e88b19d896580',
  page: 1,
  pageSize: 100,
  intervalMinutes: 1 // Intervalo em minutos
};

const api = axios.create({
  baseURL: CONFIG.baseURL,
  headers: {
    'accept': 'application/json',
    'Authorization': `Bearer ${CONFIG.token}`
  }
});

const queues = [
  { id: 1, name: 'DEPARTAMENTO FISCAL', bandeja: 'FISCAL' },
  { id: 2, name: 'DEPARTAMENTO CONTÁBIL', bandeja: 'CONTABIL' },
  { id: 3, name: 'RH', bandeja: 'OUTROS' },
  { id: 4, name: 'DEPARTAMENTO PESSOAL', bandeja: 'DP' },
  { id: 6, name: 'ONBOARDING', bandeja: 'CONSULTORIA' },
  { id: 7, name: 'TI ', bandeja: 'TI' },
  { id: 8, name: 'CADASTRO', bandeja: 'SOCIETARIO' },
  { id: 9, name: 'FINANCEIRO', bandeja: 'FINANCEIRO' },
  { id: 10, name: 'COMERCIAL', bandeja: 'COMERCIAL' },
  { id: 11, name: 'RECEPÇÃO', bandeja: 'OUTROS' },
  { id: 12, name: 'REGULARIDADE', bandeja: 'SOCIETARIO' }
];

// Para evitar notificações duplicadas para o mesmo ticket

const ticketsNotificados = new Set();

// Função para buscar tickets pendentes e retornar contatos
async function buscarTicketsPendentes() {
  try {
    const timestamp = new Date().toLocaleString('pt-BR');
    // Buscar tickets da primeira página
    const response = await api.get(CONFIG.endpoint, {
      params: {
        page: CONFIG.page,
        pageSize: CONFIG.pageSize
      }
    });
    if (response.data && Array.isArray(response.data.tickets) && response.data.tickets.length > 0) {
      // Buscar a última página para garantir que pegou todos os tickets recentes
      const responseUltimasMensagens = await api.get(CONFIG.endpoint, {
        params: {
          page: response.data.lastPage,
          pageSize: CONFIG.pageSize
        }
      });
      // Filtrar apenas tickets pendentes ou pausados com mensagens não lidas
      const ticketsPendentes = responseUltimasMensagens.data.tickets.filter(ticket => 
        ticket.status === 'pending' || 
        (ticket.status === 'paused' && ticket.unreadMessages > 0)
      );
      const contatos = [];
      for (const ticket of ticketsPendentes) {
        // Evita notificar o mesmo ticket mais de uma vez
        if (ticketsNotificados.has(ticket.id)) continue;
        let queue = queues.find(queue => queue.id === ticket.queueId);
        if (!queue) continue;
        try {
          const contactId = ticket.contactId;
          if (!contactId) continue;
          const contatoResponse = await api.get(`/contacts/${contactId}`);
          if (contatoResponse.data) {
            contatos.push({
              nomeCliente: contatoResponse.data.name,
              queue: queue.bandeja,
              ticketId: ticket.id,
              status: ticket.status // Adicionado status
            });
          }
        } catch (erroContato) {
          // Apenas loga o erro, mas não interrompe o loop
          console.error(`[${timestamp}] Erro ao buscar contato para ticket ${ticket.id}:`, erroContato.message);
        }
      }
      return contatos;
    }
    return [];
  } catch (error) {
    const timestamp = new Date().toLocaleString('pt-BR');
    console.error(`[${timestamp}] ❌ Erro na requisição de tickets:`, error.message);
    return [];
  }
}

// Função principal para notificar tickets pendentes
export async function notificarTicketsPendentes(io) {
  const contatos = await buscarTicketsPendentes();
  const timestamp = new Date().toISOString();
  for (const contato of contatos) {
    let mensagem = '';
    let titulo = '';
    if (contato.status === 'paused') {
      mensagem = `Cliente ${contato.nomeCliente} enviou uma mensagem em atendimento PAUSADO no Setor ${contato.queue}.`;
      titulo = 'Nova mensagem em atendimento pausado';
    } else {
      mensagem = `Cliente: ${contato.nomeCliente}. Aguardando atendimento no Setor: ${contato.queue}. `;
      titulo = 'Novo atendimento Zappy Contábil';
    }
    const notificacao = {
      tipo: 'imediata',
      titulo: titulo,
      mensagem: mensagem,
      setores: [contato.queue],
      usuario: null,
      icone: '',
      link: '',
    };
    await enviarParaSetores(io, notificacao, [contato.queue], timestamp);
  }
}
