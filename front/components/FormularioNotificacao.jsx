import { useState, useEffect } from 'react';
import { Box, Grid, Typography, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField} from '@mui/material';
import CamposNotificacao from './CamposNotificacao';
import SelecaoSetoresETipo from './SelecaoSetoresETipo';
import BotaoEnviar from './BotaoEnviar';
import DefineIcon from './DefineIcon';
import axios from 'axios';

const setoresDisponiveis = ['ADMIN', 'BPO', 'COMERCIAL', 'CONTABIL','CONSULTORIA', 'DESENVOLVIMENTO', 'DP', 'FINANCEIRO', 'FISCAL', 'MARKETING', 'SOCIETARIO', 'TI', 'OUTROS'];

const FormularioNotificacao = ({ socket, usuarioSelecionadoGlobal, setUsuarioSelecionadoGlobal }) => {
  const [form, setForm] = useState({
    titulo: '',
    mensagem: '',
    horario: '',
    link: '',
    iconeName: '12.png',
    usuario: '',
    tipo: '',
    repete: '',
    intervalo: '5',
    setoresSelecionados: [],
  });

  // Estados para modal de usuários online
  const [modalUsuarios, setModalUsuarios] = useState(false);
  const [usuariosOnline, setUsuariosOnline] = useState([]);
  const [errorUsuarios, setErrorUsuarios] = useState('');

  const limparCampos = () => {
    setForm({
      titulo: '',
      mensagem: '',
      horario: '',
      link: '',
      iconeName: '',
      usuario: '',
      tipo: '',
      repete: '',
      intervalo: '5',
      setoresSelecionados: [],
    });
  };

  const buscarUsuariosOnline = async () => {
    try {
      setErrorUsuarios('');
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/notificacoes/usuarios`);
      setUsuariosOnline(response.data);
    } catch (err) {
      setErrorUsuarios('Erro ao buscar usuários online');
    }
  };

const enviarNotificacao = async () => {
  const {
    titulo, mensagem, horario, link, iconeName, usuario,
    tipo, repete, intervalo, setoresSelecionados
  } = form;
  if (!mensagem.trim() || !tipo) {
    alert('Preencha todos os campos obrigatórios e selecione o tipo');
    return;
  }

  if ((tipo === 'agendada' || tipo === 'fixa') && !horario) {
    alert('Horário é obrigatório para esse tipo de notificação');
    return;
  }

  const payload = {
    tipo,
    titulo,
    mensagem,
    link: link || null,
    icone: iconeName,
    usuario,
    setores: setoresSelecionados,
    horario: (tipo !== 'imediata' && horario) ? new Date(horario).toISOString() : null,
    repete: parseInt(repete) || '0',
    intervalo: parseInt(intervalo) || '',
  };

  try {
    socket.emit('novaNotificacao', payload, (response) => {
      if (response?.status === 'ok') {
        console.log('✅ Notificação criada:', response.data);
      } else {
        console.error('❌ Erro:', response?.error || response);
      }
    });
    limparCampos();
  } catch (error) {
    console.error('❌ Erro ao enviar notificação:', error);
  }
};



  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  useEffect(() => {
    if (usuarioSelecionadoGlobal) {
      setForm(prev => ({ ...prev, usuario: usuarioSelecionadoGlobal }));
      setUsuarioSelecionadoGlobal('');
    }
  }, [usuarioSelecionadoGlobal, setUsuarioSelecionadoGlobal]);

  return (
    <>
      <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
        Informações da Notificação
      </Typography>

      <Grid container spacing={2}>
        {/* Campo Usuário (AD) sem botão Buscar Online, alinhado */}
        <Grid item xs={12} sm={3}>
          <TextField
            size="small"
            label="Usuário (AD)"
            value={form.usuario}
            onChange={e => handleChange('usuario', e.target.value)}
            fullWidth
          />
        </Grid>
        {/* Restante dos campos */}
        <CamposNotificacao form={form} onChange={handleChange} />
        <SelecaoSetoresETipo
          form={form}
          onChange={handleChange}
          setoresDisponiveis={setoresDisponiveis}
        />
        <Grid item xs={12}>
          <DefineIcon handleMudarIcone={(nome) => handleChange('iconeName', nome)} />
        </Grid>
      </Grid>

      {/* Modal de Seleção de Usuário Online */}
      <Dialog open={modalUsuarios} onClose={() => setModalUsuarios(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Usuários Online</DialogTitle>
        <DialogContent>
          {errorUsuarios && (
            <Typography color="error">{errorUsuarios}</Typography>
          )}
          {usuariosOnline.length === 0 && !errorUsuarios ? (
            <Typography>Nenhum usuário online.</Typography>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 1 }}>
              {usuariosOnline.map((user, idx) => (
                <Button
                  key={idx}
                  variant="outlined"
                  onClick={() => {
                    handleChange('usuario', user.usuario);
                    setModalUsuarios(false);
                  }}
                  sx={{ justifyContent: 'flex-start' }}
                  fullWidth
                >
                  {user.usuario} <span style={{ marginLeft: 8, color: '#888', fontSize: 12 }}>{user.maquina}</span>
                </Button>
              ))}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setModalUsuarios(false)}>Fechar</Button>
        </DialogActions>
      </Dialog>

      <Box display="flex" justifyContent="flex-end" mt={2}>
        <BotaoEnviar disabled={!form.tipo || !form.mensagem} onClick={enviarNotificacao} />
      </Box>
    </>
      );
    };
    
    export default FormularioNotificacao;