import express from 'express';
import { executeQuery } from './database.js';
import { formatDateForMySQL, parseSetores } from './websocket-socketio.js';


const router = express.Router();

// GET - Listar todas as notificações
router.get('/', async (req, res) => {
  try {
    const query = 'SELECT * FROM bandeja_bd.notificacoes ORDER BY createdAt DESC';
    const notificacoes = await executeQuery(query);

    // Use parseSetores para garantir que setores sempre será um array
    const notificacoesProcessadas = notificacoes.map(notificacao => ({
      ...notificacao,
      setores: parseSetores(notificacao.setores),
      horario: notificacao.horario ? new Date(notificacao.horario).toISOString() : null

    }));

    res.status(200).json({
      data: notificacoesProcessadas,
      status: 200
    });
  } catch (error) {
    console.error('Erro ao buscar notificações:', error);
    res.status(500).json({
      data: { message: 'Erro interno do servidor' },
      status: 500
    });
  }
});


// POST - Criar nova notificação
router.post('/', async (req, res) => {
  try {
    const {
      titulo,
      mensagem,
      usuario,
      tipo,
      horario,
      icone,
      link,
      setores,
      repete,
      intervalo
    } = req.body;
    if (!mensagem || !tipo) {
      return res.status(400).json({ message: 'Mensagem e tipo são obrigatórios' });
    }

    const repeticoes = parseInt(repete) >= 0 ? parseInt(repete) : 0;
    const intervaloMinutos = parseInt(intervalo) || 0;
    const setoresJson = setores ? JSON.stringify(setores) : JSON.stringify([]);
    
    const agendadaPara = tipo === 'imediata' ? null : formatDateForMySQL(horario ? new Date(horario) : new Date());
    
    const result = await executeQuery(
      `
      INSERT INTO bandeja_bd.notificacoes
      (titulo, mensagem, usuario, tipo, horario, icone, link, setores, agendadaPara, ativo, repete, intervalo, repeticoes_enviadas)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        titulo,
        mensagem,
        usuario,
        tipo,
        formatDateForMySQL(horario ? new Date(horario) : new Date()),
        icone,
        link,
        setoresJson,
        agendadaPara,
        true,
        repeticoes,
        intervaloMinutos,
        0 // repeticoes_enviadas inicia em 0
      ]
    );
    
    const [notificacaoCriada] = await executeQuery(
      `SELECT * FROM bandeja_bd.notificacoes WHERE id = ?`,
      [result.insertId]
    );
    
    try {
      notificacaoCriada.setores = JSON.parse(notificacaoCriada.setores || '[]');
    } catch {
      notificacaoCriada.setores = [];
    }
    
    res.status(201).json({
      data: notificacaoCriada,
      status: 201
    });

    console.log('✅ Notificação criada com sucesso:', novasNotificacoes);

  } catch (error) {
    console.error('Erro ao criar notificação:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});


// PUT - Atualizar notificação
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const dadosAtualizados = req.body;

    // Função para converter datas ISO para o formato MySQL
    const formatDateToMySQL = (date) => {
      if (!date) return null;
      const d = new Date(date);
      const pad = (n) => String(n).padStart(2, '0');
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
    };

    // Tratar campos vazios
    if (dadosAtualizados.horario === '') dadosAtualizados.horario = null;
    if (dadosAtualizados.repete === '') dadosAtualizados.repete = null;
    if (dadosAtualizados.intervalo === '') dadosAtualizados.intervalo = null;
    if (dadosAtualizados.agendadaPara === '') dadosAtualizados.agendadaPara = null;

    // Converter datas para formato MySQL
    ['horario', 'createdAt', 'updatedAt', 'agendadaPara'].forEach((campo) => {
      if (dadosAtualizados[campo]) {
        dadosAtualizados[campo] = formatDateToMySQL(dadosAtualizados[campo]);
      }
    });

    // Verificar se a notificação existe
    const [notificacaoExistente] = await executeQuery(
      'SELECT * FROM bandeja_bd.notificacoes WHERE id = ?',
      [id]
    );

    if (!notificacaoExistente) {
      return res.status(404).json({
        data: { message: 'Notificação não encontrada' },
        status: 404,
      });
    }

    // Preparar dados para UPDATE
    const campos = [];
    const valores = [];

    Object.keys(dadosAtualizados).forEach((campo) => {
      if (campo !== 'id') {
        campos.push(`${campo} = ?`);
        if (campo === 'setores') {
          valores.push(JSON.stringify(dadosAtualizados[campo] || []));
        } else {
          valores.push(dadosAtualizados[campo]);
        }
      }
    });

    valores.push(id); // Para o WHERE

    const query = `UPDATE bandeja_bd.notificacoes SET ${campos.join(', ')} WHERE id = ?`;
    await executeQuery(query, valores);

    // Buscar a notificação atualizada
    const [notificacaoAtualizada] = await executeQuery(
      'SELECT * FROM bandeja_bd.notificacoes WHERE id = ?',
      [id]
    );

    // Fazer parse seguro do JSON de setores
    try {
      const setores = notificacaoAtualizada.setores;
      notificacaoAtualizada.setores =
        typeof setores === 'string' && setores.trim() !== ''
          ? JSON.parse(setores)
          : [];
    } catch (err) {
      console.error('Erro ao fazer parse dos setores:', err);
      notificacaoAtualizada.setores = [];
    }

    res.status(200).json({
      data: notificacaoAtualizada,
      status: 200,
    });
  } catch (error) {
    console.error('Erro ao atualizar notificação:', error);
    res.status(500).json({
      data: { message: 'Erro interno do servidor' },
      status: 500,
    });
  }
});


// DELETE - Excluir notificação
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verificar se a notificação existe
    const [notificacaoExistente] = await executeQuery(
      'SELECT * FROM bandeja_bd.notificacoes WHERE id = ?',
      [id]
    );
    
    if (!notificacaoExistente) {
      return res.status(404).json({
        data: { message: 'Notificação não encontrada' },
        status: 404
      });
    }
    
    // Excluir a notificação
    await executeQuery('DELETE FROM bandeja_bd.notificacoes WHERE id = ?', [id]);

        try {
        const setores = notificacaoExistente.setores;
        
            if (typeof setores === 'string' && setores.trim() !== '') {
              notificacaoExistente.setores = JSON.parse(setores);
            } else if (Array.isArray(setores)) {
              notificacaoExistente.setores = setores; // já é array
            } else {
              notificacaoExistente.setores = [];
            }
          } catch (err) {
            console.error('Erro ao fazer parse dos setores:', err);
            notificacaoExistente.setores = [];
          }
    
   
    
    res.status(200).json({
      data: { 
        message: 'Notificação excluída com sucesso',
        notificacao: notificacaoExistente
      },
      status: 200
    });
  } catch (error) {
    console.error('Erro ao excluir notificação:', error);
    res.status(500).json({
      data: { message: 'Erro interno do servidor' },
      status: 500
    });
  }
});


// GET - Estatísticas
router.get('/stats/dashboard', async (req, res) => {
  try {
    // Total de notificações
    const [totalResult] = await executeQuery('SELECT COUNT(*) as total FROM bandeja_bd.notificacoes');
    const total = totalResult.total;
    
    // Notificações ativas
    const [ativasResult] = await executeQuery('SELECT COUNT(*) as ativas FROM bandeja_bd.notificacoes WHERE ativo = true');
    const ativas = ativasResult.ativas;
    
    // Por tipo
    const tiposResult = await executeQuery(`
      SELECT tipo, COUNT(*) as count 
      FROM bandeja_bd.notificacoes 
      GROUP BY tipo
    `);
    const porTipo = {
      imediata: 0,
      agendada: 0,
      fixa: 0
    };
    tiposResult.forEach(row => {
      porTipo[row.tipo] = row.count;
    });
    
    // Por setor
    const setoresResult = await executeQuery('SELECT setores FROM bandeja_bd.notificacoes WHERE setores IS NOT NULL');
    const porSetor = {};
    setoresResult.forEach(row => {
      const setores = JSON.parse(row.setores);
      if (setores && setores.length > 0) {
        setores.forEach(setor => {
          porSetor[setor] = (porSetor[setor] || 0) + 1;
        });
      } else {
        porSetor['Todos'] = (porSetor['Todos'] || 0) + 1;
      }
    });
    
    // Notificações recentes
    const recentesResult = await executeQuery(`
      SELECT * FROM bandeja_bd.notificacoes 
      ORDER BY createdAt DESC 
      LIMIT 5
    `);
    
    const recentes = recentesResult.map(notificacao => ({
      ...notificacao,
      setores: notificacao.setores ? JSON.parse(notificacao.setores) : []
    }));
    
    res.status(200).json({
      data: {
        total,
        ativas,
        inativas: total - ativas,
        porTipo,
        porSetor,
        recentes
      },
      status: 200
    });
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error);
    res.status(500).json({
      data: { message: 'Erro interno do servidor' },
      status: 500
    });
  }
});


// GET - consultar usuarios ativos
router.get('/usuarios', async (req, res) => {
  try {
    const results = await executeQuery(
      `SELECT usuario, maquina, data_conexao FROM bandeja_bd.conexoes_ws WHERE data_desconexao IS NULL`
    );

    // 👇 Ajusta o fuso de Brasília sem dependências
    results.forEach(row => {
      row.data_conexao = new Date(row.data_conexao).toLocaleString('pt-BR', {
        timeZone: 'America/Sao_Paulo'
      });
    });

    res.json(results);

  } catch (err) {
    console.error('Erro ao buscar usuários ativos:', err);
    res.status(500).json({ error: 'Erro interno' });
  }
});





export default router;
