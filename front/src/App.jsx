import React, { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client'; // <-- IMPORTA O CLIENTE
import { Box, Typography, Paper, Chip, Tabs, Tab } from '@mui/material';
import FormularioNotificacao from '../components/FormularioNotificacao';
import TabelaNotificacoes from '../components/TabelaNotificacoes';
import EstatisticasNotificacoes from '../components/EstatisticasNotificacoes';
import UsuariosOnlinePainel from '../components/UsuariosOnlinePainel';

function App() {
  const [connectionStatus, setConnectionStatus] = useState('🔴 Desconectado');
  const [activeTab, setActiveTab] = useState(0);
  const socketRef = useRef(null);
  const [usuarioSelecionadoGlobal, setUsuarioSelecionadoGlobal] = useState('');

  useEffect(() => {
    // ✅ Conectar ao Socket.IO server
    socketRef.current = io('http://localhost:3000'); // 🚩 Altere se precisar

    socketRef.current.on('connect', () => {
      setConnectionStatus('🟢 Conectado');
      console.log('✅ Conectado ao Socket.IO Server');

      // Por exemplo: identificar o usuário aqui
//      socketRef.current.emit('identificar', {
//       userId: 'MINHA_MAQUINA',  // ajuste conforme necessário
//        nome: 'MeuUsuario',
//        setor: 'Financeiro'
//      });
    });

    socketRef.current.on('disconnect', () => {
      setConnectionStatus('🔴 Desconectado');
      console.log('🔴 Desconectado do Socket.IO Server');
    });

    socketRef.current.on('connect_error', (err) => {
      setConnectionStatus('🔴 Erro na conexão');
      console.error('❌ Erro ao conectar:', err);
    });

    socketRef.current.on('nova_mensagem', (data) => {
      console.log('📨 Nova mensagem recebida:', data);

      if (Notification.permission === 'granted') {
        new Notification('Notificação', {
          body: data.mensagem,
          icon: './icons/logo.png'
        });
      } else if (Notification.permission !== 'denied') {
        Notification.requestPermission().then(permission => {
          if (permission === 'granted') {
            new Notification('Notificação', {
              body: data.mensagem,
              icon: './icons/logo.png'
            });
          }
        });
      }
    });
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  return (
    <Box sx={{ minHeight: '100vh', p: 4 }}>
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3, justifyContent: 'center', alignItems: 'flex-start' }}>
        <Paper elevation={3} sx={{ maxWidth: 1200, flex: 1, p: 4, borderRadius: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                Central de Notificações
              </Typography>
              <img
                src="/icons/logo.png"
                alt="Ícone"
                style={{ width: 48, height: 'auto' }}
              />
            </Box>
            <Chip
              label={connectionStatus}
              color={connectionStatus.includes('🟢') ? 'success' : 'error'}
              variant="outlined"
            />
          </Box>

          <Tabs value={activeTab} onChange={handleTabChange} sx={{ mb: 3 }}>
            <Tab label="Nova Notificação" />
            <Tab label="Gerenciar Notificações" />
            <Tab label="Dashboard" />
          </Tabs>

          {activeTab === 0 && <FormularioNotificacao socket={socketRef.current} usuarioSelecionadoGlobal={usuarioSelecionadoGlobal} setUsuarioSelecionadoGlobal={setUsuarioSelecionadoGlobal} />}
          {activeTab === 1 && <TabelaNotificacoes socket={socketRef.current} />}
          {activeTab === 2 && <EstatisticasNotificacoes />}
        </Paper>
        <Box sx={{ width: { xs: '100%', md: 320 }, minWidth: 260 }}>
          <UsuariosOnlinePainel onSelecionarUsuario={setUsuarioSelecionadoGlobal} />
        </Box>
      </Box>
    </Box>
  );
}

export default App;