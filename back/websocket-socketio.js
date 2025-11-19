import { Server } from 'socket.io';
import { executeQuery } from './database.js';


// Armazenar informações dos clientes conectados
const connectedClients = new Map();

// Criar e configurar o Socket.io Server
export function createSocketServer(server) {
  const io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  io.on('connection', (socket) => {

    // IDENTIFICAR USUÁRIO E MÁQUINA
    socket.on('identificar', async (data) => {
      if (!data || !data.userId || !data.nome) {
        logErro('identificar', 'Dados de identificação inválidos');
        return;
      }
      console.log(`Identificando cliente: ${data.userId} / ${data.nome}`);
      connectedClients.set(socket.id, {
        socketId: socket.id,
        userId: data.userId, // Nome máquina
        nome: data.nome,
      });
      try {
        await executeQuery(
          `INSERT INTO bandeja_bd.conexoes_ws (usuario, maquina, data_conexao)
           VALUES (?, ?, NOW())
           ON DUPLICATE KEY UPDATE
             maquina = VALUES(maquina),
             data_conexao = NOW(),
             data_desconexao = NULL`,
          [data.nome, data.userId]
        );
        console.log(`Conexão salva: ${data.nome} - ${data.userId}`);
      } catch (err) {
        logErro('salvar conexão', err);
      }
    });

    // NOVA NOTIFICAÇÃO
    socket.on('novaNotificacao', async (data, callback) => {
      try {
        if (!data || !data.tipo || !data.titulo || !data.mensagem) {
          if (callback) callback({ status: 'error', error: 'Dados obrigatórios ausentes' });
          logErro('novaNotificacao', 'Dados obrigatórios ausentes');
          return;
        }
        const {
          tipo, titulo, mensagem, link, icone, usuario,
          setores, horario, repete, intervalo
        } = data;
        let destinatario = null;
        if (tipo === 'imediata' && usuario) {
          destinatario = Array.from(connectedClients.values())
            .find(client => client.nome && client.nome.toLowerCase() === usuario.toLowerCase());
          if (!destinatario) {
            console.warn(`Usuário ${usuario} não conectado — notificação NAO salva.`);
            if (callback) {
              callback({ status: 'error', error: `Usuário ${usuario} não conectado` });
            }
            return;
          }
        }
        const agendadaPara = horario ? formatDateForMySQL(new Date(horario)) : formatDateForMySQL(new Date());
        const result = await executeQuery(
          `INSERT INTO bandeja_bd.notificacoes
            (tipo, titulo, mensagem, link, icone, usuario, setores, agendadaPara, ativo, repete, intervalo)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)` ,
          [
            tipo,
            titulo,
            mensagem,
            link || null,
            icone || null,
            usuario || null,
            JSON.stringify(setores || []),
            agendadaPara,
            repete || null,
            intervalo || null
          ]
        );
        console.log(` Notificação salva: ID ${result.insertId}`);
        if (callback) {
          callback({ status: 'ok', data: { id: result.insertId, ...data } });
        }
        if (tipo === 'imediata') {
          // const payload = {
          //   id: result.insertId, // Inclua o ID aqui
          //   tipo,
          //   mensagem,
          //   titulo,
          //   icone,
          //   link,
          //   timestamp: new Date().toISOString()
          // };
          // if (usuario) {
          //   enviarMensagem(io, destinatario.socketId, payload);
          //   console.log(`📨 Notificação imediata enviada para usuário ${usuario}`);
          // } else if (setores && setores.length > 0) {
          //   setores.forEach(setor => {
          //     enviarMensagemParaSetor(io, setor, payload);
          //   });
          // } else {
          //   io.emit('nova_mensagem', payload);
          // }
          console.log(`Notificação imediata processada`);
        } else {
          console.log(`Notificação ${tipo} salva. Disparo será pelo job.`);
        }
      } catch (err) {
        logErro('salvar notificação', err);
        if (callback) {
          callback({ status: 'error', error: err.message });
        }
      }
    });

    // CONFIRMAR NOTIFICAÇÃO
    // socket.on('confirmar_notificacao', async (data) => {
    //   try {
    //     console.log('Recebido em confirmar_notificacao:', data);
    //     if (!data || !data.id || !data.user || !data.maquina) {
    //       logErro('confirmar_notificacao', 'Dados inválidos');
    //       return;
    //     }
    //         // Busca o título da notificação
    //     const [notificacao] = await executeQuery(
    //       `SELECT titulo FROM bandeja_bd.notificacoes WHERE id = ?`,
    //       [data.id]
    //     );
    //     const titulo = notificacao ? notificacao.titulo : null;

    //     await executeQuery(
    //       `INSERT INTO bandeja_bd.notificacoes_confirmadas (notificacao_id, titulo, usuario, maquina, data_confirmacao)
    //       VALUES (?, ?, ?, ?, NOW())
    //       ON DUPLICATE KEY UPDATE data_confirmacao = NOW(), titulo = VALUES(titulo)`,
    //       [data.id, titulo, data.user, data.maquina]
    //     );

    //     // Desativa a notificação para todos
    //    await executeQuery(
    //     `UPDATE bandeja_bd.notificacoes SET ativo = 0 WHERE id = ?`,
    //     [data.id]
    //    );
    //     console.log(`Notificação ${data.id} confirmada por ${data.user} (${data.maquina})`);
    //   } catch (err) {
    //     logErro('confirmar_notificacao', err);
    //   }
    // });


    // Mostrar que o usuário desconectou e atualiza o banco
    socket.on('disconnect', async () => {
      const cliente = connectedClients.get(socket.id);
      if (cliente) {
        console.log(`Cliente desconectado: ${cliente.nome}`);
        try {
          await executeQuery(
            `UPDATE bandeja_bd.conexoes_ws
            SET data_desconexao = NOW()
            WHERE usuario = ?`,
            [cliente.nome]
          );
          console.log(`Desconexão marcada no banco para ${cliente.nome}`);
        } catch (err) {
          logErro('atualizar desconexão', err);
        }
        connectedClients.delete(socket.id);
      }
    });


  });

  return io;
}

// Mapeamento de padrões para cada setor
const PADROES_SETORES = {
  'ADMIN': ['ADMIN'],
  'BPO': ['BPO'],
  'COMERCIAL': ['COMER', 'COMERCIAL', 'COMERC'],
  'CONTABIL': ['CONTAB', 'CONTABIL'],
  'CONSULTORIA': ['CONSULT', 'CONSULTOR'],
  'DESENVOLVIMENTO': ['DEV', 'DESENV', 'DESENVOLVIMENTO'],
  'DP': ['DP'],
  'FINANCEIRO': ['FINAN', 'FINANCEIRO'],
  'FISCAL': ['FISC', 'FISCAL'],
  'MARKETING': ['MARK', 'MARKETING', 'MKT'],
  'SOCIETARIO': ['SOC', 'SOCIETARIO'],
  'TI': ['TI'],
  'OUTROS': ['OUTRO', 'OUTROS', 'UNICO']
};

// Cria o payload para a notificação
function criarPayload(notificacao, timestamp) {
  return {
    id: notificacao.id,
    tipo: notificacao.tipo,
    titulo: notificacao.titulo,
    mensagem: notificacao.mensagem,
    icone: notificacao.icone,
    link: notificacao.link,
    timestamp
  };
}

//===============================ENVIAR NOTIFICAÇÕES PARA USUÁRIOS============================================//

// Função para envio de notificações
function enviarMensagem(io, destino, payload) {
  if (Array.isArray(destino)) {
    destino.forEach(socketId => io.to(socketId).emit('nova_mensagem', payload));
  } else {
    io.to(destino).emit('nova_mensagem', payload);
  }
}

// Enviar notificação para usuario especifico //
async function enviarParaUsuario(io, notificacao, timestamp) {
  const destinatario = Array.from(connectedClients.values())
    .find(client =>
      client.nome &&
      client.nome.toLowerCase() === notificacao.usuario.toLowerCase()
    );

    if (destinatario) {
      io.to(destinatario.socketId).emit('nova_mensagem', criarPayload(notificacao, timestamp));
      console.log(`Notificação ${notificacao.id} enviada para usuário ${notificacao.usuario}`);
    } else {
      console.warn(`Usuário ${notificacao.usuario} não conectado`);
    }
}
  
// Enviar notificação para todos //
  async function enviarParaTodos(io, notificacao, timestamp) {
    io.emit('nova_mensagem', criarPayload(notificacao, timestamp));
    console.log(`Notificação ${notificacao.id} enviada para todos`);
}
  
//====================================ENVIAR NOTIFICAÇÕES PARA SETORES============================================//
  
 // Enviar notificação para maquinas especificas //
  async function enviarParaSetores(io, notificacao, setores, timestamp) {
    setores.forEach(setor => {
      const padroes = PADROES_SETORES[setor.toUpperCase()] || [setor.toUpperCase()];
      const maquinasCoincidentes = Array.from(connectedClients.values()).filter(client => {
        if (!client.userId) return false;
        const nomeMaquina = client.userId.toUpperCase();
        return padroes.some(padrao => nomeMaquina.includes(padrao));
      });
      if (maquinasCoincidentes.length === 0) {
        console.warn(`Nenhuma máquina coincidente para setor "${setor}"`);
        return;
      }
      maquinasCoincidentes.forEach(client => {
        enviarMensagem(io, client.socketId, {
          id: notificacao.id,
          tipo: notificacao.tipo || 'setor',
          titulo: notificacao.titulo || '',
          mensagem: notificacao.mensagem || '',
          icone: notificacao.icone || '',
          link: notificacao.link || '',
          timestamp: timestamp || new Date().toISOString()
        });
        console.log(`Notificação enviada para máquina ${client.userId}`);
      });
    });
    console.log(`Notificação ${notificacao.id} enviada para setores ${setores.join(', ')}`);
}
  
//========================================UTILITÁRIOS=============================================//
  
// Formata a data para o formato MySQL (utilizando o horário local do servidor)
  export function formatDateForMySQL(date) {
    const d = new Date(date);
    const pad = n => n.toString().padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ` +
           `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}
  
// Retorna o timestamp no horário local do servidor, formato brasileiro
  function getLocalTimestamp() {
    const d = new Date();
    const pad = n => n.toString().padStart(2, '0');
    return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}, ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}
  
// Função para logs de erro padronizados
  function logErro(contexto, err) {
    console.error(`[${contexto}]`, err);
}
  
// Dispara as notificações programadas
  export async function startNotificacaoJob(io) {
    const intervalo = 10 * 1000;
  
    async function job() {
      const agora = new Date();
      const timestamp = getLocalTimestamp();
  
      try {
        // Busca notificações ativas com repetições pendentes
        const notificacoes = await executeQuery(`
          SELECT * FROM bandeja_bd.notificacoes
          WHERE ativo = 1
            AND tipo IN ('agendada', 'fixa', 'imediata')
            AND agendadaPara IS NOT NULL
            AND repete IS NOT NULL
            AND intervalo IS NOT NULL
        `);
  
        for (const notificacao of notificacoes) {
          if (notificacao.tipo === 'fixa') {
            const agendada = new Date(notificacao.agendadaPara);
            const agora = new Date();
            let repeticoesEnviadas = notificacao.repeticoes_enviadas || 0;
            const maxRepeticoes = notificacao.repete ? Number(notificacao.repete) : 1;
            const intervaloMinutos = notificacao.intervalo || 0;
  
            // Verifica se é um novo dia e zera o contador de repetições
            const ultimaExecucao = notificacao.ultima_execucao ? new Date(notificacao.ultima_execucao) : null;
            const novoDia = !ultimaExecucao ||
              ultimaExecucao.getFullYear() !== agora.getFullYear() ||
              ultimaExecucao.getMonth() !== agora.getMonth() ||
              ultimaExecucao.getDate() !== agora.getDate();
  
            if (novoDia && repeticoesEnviadas > 0) {
              await executeQuery(
                'UPDATE bandeja_bd.notificacoes SET repeticoes_enviadas = 0 WHERE id = ?',
                [notificacao.id]
              );
              repeticoesEnviadas = 0; // Atualiza localmente também
            }
  
            // Calcular o horário da próxima execução
            const proximaExecucao = new Date(
              agora.getFullYear(), agora.getMonth(), agora.getDate(),
              agendada.getHours(), agendada.getMinutes(), agendada.getSeconds(), 0
            );
            proximaExecucao.setMinutes(proximaExecucao.getMinutes() + repeticoesEnviadas * intervaloMinutos);

          if (agora >= proximaExecucao && repeticoesEnviadas < maxRepeticoes) {
            await processarNotificacao(io, notificacao, timestamp);

            // Atualiza o número de repetições enviadas e ultima_execucao
            await executeQuery(
              'UPDATE bandeja_bd.notificacoes SET repeticoes_enviadas = repeticoes_enviadas + 1, ultima_execucao = NOW() WHERE id = ?',
              [notificacao.id]
            );
            // NÃO desativa a notificação! Assim ela repete no próximo dia.
          }
        } else if (notificacao.tipo === 'agendada' || notificacao.tipo === 'imediata') {
          const agendada = new Date(notificacao.agendadaPara);
          const agora = new Date();
          const repeticoesEnviadas = notificacao.repeticoes_enviadas || 0;
          const maxRepeticoes = notificacao.repete ? Number(notificacao.repete) : 1;
          const intervaloMinutos = notificacao.intervalo || 0;

          // Calcula o horário da próxima execução
          const proximaExecucao = new Date(agendada.getTime() + repeticoesEnviadas * intervaloMinutos * 60000);

          // Só envia se já chegou o horário e ainda não atingiu o máximo de repetições
          if (agora >= proximaExecucao && repeticoesEnviadas < maxRepeticoes) {
            await processarNotificacao(io, notificacao, timestamp);

            // Atualiza o número de repetições enviadas
            await executeQuery(
              'UPDATE bandeja_bd.notificacoes SET repeticoes_enviadas = repeticoes_enviadas + 1 WHERE id = ?',
              [notificacao.id]
            );

            // Se atingiu o máximo de repetições, desativa a notificação
            if (repeticoesEnviadas + 1 >= maxRepeticoes) {
              await executeQuery(
                'UPDATE bandeja_bd.notificacoes SET ativo = 0 WHERE id = ?',
                [notificacao.id]
              );
            }
          }
        }
      }
    } catch (err) {
      console.error('Erro no job de notificações:', err);
    } finally {
      setTimeout(job, intervalo);
    }
  }

  job();
}
// Processa e envia as notificações
async function processarNotificacao(io, notificacao, timestamp) {
  try {
    const setores = parseSetores(notificacao.setores);

    if (notificacao.usuario) {
      await enviarParaUsuario(io, notificacao, timestamp);
    } else if (setores.length > 0) {
      await enviarParaSetores(io, notificacao, setores, timestamp);
    } else {
      await enviarParaTodos(io, notificacao, timestamp);
    }

  } catch (err) {
    console.warn(`Erro processando notificação ${notificacao.id}:`, err);
  }
}

// Parseia os setores
export function parseSetores(raw) {
  if (!raw) return [];

  if (typeof raw === 'string') {
    const valor = raw.trim();
    if (valor.startsWith('[')) {
      try {
        return JSON.parse(valor);
      } catch (err) {
        console.warn('Erro ao fazer parse do JSON de setores:', err);
        return [];
      }
    }
    return [valor];
  }

  if (Array.isArray(raw)) return raw;

  // Se for objeto ou algo inesperado
  console.warn(`Valor inesperado em setores:`, raw);
  return [];
}

export { enviarParaSetores };