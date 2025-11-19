import { useEffect, useState } from 'react';
import { Paper, Typography, List, ListItem, CircularProgress, Box, Avatar, Divider, IconButton, Tooltip } from '@mui/material';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import axios from 'axios';
import ComputerIcon from '@mui/icons-material/Computer';

const getInitial = (nome) => nome ? nome[0].toUpperCase() : '?';

const UsuariosOnlinePainel = ({ onSelecionarUsuario }) => {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');
  const [minimizado, setMinimizado] = useState(false);

  // Só mostra loading no carregamento inicial
  const buscarUsuarios = async (primeiraVez = false) => {
    if (primeiraVez) setLoading(true);
    setErro('');
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/notificacoes/usuarios`);
      setUsuarios(response.data);
    } catch (err) {
      setErro('Erro ao buscar usuários online');
      setUsuarios([]);
    } finally {
      if (primeiraVez) setLoading(false);
    }
  };

  useEffect(() => {
    buscarUsuarios(true); // Mostra loading só na primeira vez
    const interval = setInterval(() => buscarUsuarios(false), 10000); // Não mostra loading nas próximas
    return () => clearInterval(interval);
  }, []);

  return (
    <Paper elevation={4} sx={{
      p: 2,
      minWidth: 260,
      maxWidth: 340,
      width: { xs: '100%', md: 320 },
      height: '100%',
      bgcolor: '#f8fafc',
      border: '1px solid #e0e7ef',
      borderRadius: 3,
      boxShadow: '0 2px 12px 0 rgba(60,72,100,0.06)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'stretch',
    }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#1976d2', letterSpacing: 0.5, textAlign: 'center', fontSize: 18 }}>
          Usuários Online
        </Typography>
        <Tooltip title={minimizado ? 'Expandir' : 'Minimizar'}>
          <IconButton size="small" onClick={() => setMinimizado(m => !m)}>
            {minimizado ? <ExpandMoreIcon /> : <ExpandLessIcon />}
          </IconButton>
          </Tooltip>
      </Box>
      {!minimizado && (
        loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 80 }}>
            <CircularProgress size={28} />
          </Box>
        ) : erro ? (
          <Typography color="error" sx={{ textAlign: 'center', fontSize: 14 }}>{erro}</Typography>
        ) : usuarios.length === 0 ? (
          <Typography sx={{ textAlign: 'center', fontSize: 14 }}>Nenhum usuário online.</Typography>
        ) : (
          <List sx={{ width: '100%', maxHeight: '60vh', overflowY: 'auto', pr: 1 }}>
            {usuarios.map((user, idx) => (
              <Box key={user.usuario}>
                <ListItem
                  button
                  onClick={() => onSelecionarUsuario && onSelecionarUsuario(user.usuario)}
                  sx={{
                    gap: 1,
                    py: 1,
                    cursor: 'pointer',
                    borderRadius: 2,
                    transition: 'background 0.2s',
                    '&:hover': { background: '#e3eafc' },
                    alignItems: 'center',
                  }}
                >
                  <Avatar sx={{ bgcolor: '#1976d2', width: 32, height: 32, fontSize: 15 }}>
                    {getInitial(user.usuario)}
                  </Avatar>
                  <Box sx={{ display: 'flex', alignItems: 'center', ml: 1, gap: 1 }}>
                    <span style={{
                      fontWeight: 700,
                      fontSize: 13,
                      color: '#174ea6',
                      letterSpacing: '0.5px',
                      fontFamily: 'Segoe UI, Arial, sans-serif',
                      textShadow: '0 1px 2px #e3eafc',
                    }}>{user.usuario}</span>
                    <span style={{ color: '#b0b8c9', fontSize: 11, fontStyle: 'italic', display: 'flex', alignItems: 'center', marginLeft: 8, fontFamily: 'Segoe UI, Arial, sans-serif' }}>
                      <ComputerIcon sx={{ fontSize: 13, mr: 0.5, color: '#b0b8c9' }} />
                      {user.maquina}
                    </span>
                  </Box>
                </ListItem>
                {/* Divider, exceto no último item */}
                {idx < usuarios.length - 1 && <Divider variant="inset" component="li" />}
              </Box>
            ))}
          </List>
        )
      )}
    </Paper>
  );
};

export default UsuariosOnlinePainel;