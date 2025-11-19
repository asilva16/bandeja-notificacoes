import React, { useState, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Chip,
  Typography,
  Box,
  TablePagination,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Tooltip,
  Avatar,
  Switch,
  FormControlLabel,
  Checkbox
} from '@mui/material';
import axios from 'axios';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Schedule as ScheduleIcon,
  Notifications as NotificationsIcon,
  Link as LinkIcon,
  PowerSettingsNew as PowerIcon
} from '@mui/icons-material';


const TabelaNotificacoes = ({ ws }) => {
  const [notificacoes, setNotificacoes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selectedIds, setSelectedIds] = useState([]);
  const [successMessage, setSuccessMessage] = useState('');

  // Estados para modais
  const [modalView, setModalView] = useState({ open: false, data: null });
  const [modalEdit, setModalEdit] = useState({ open: false, data: null });
  const [modalDelete, setModalDelete] = useState({ open: false, id: null });

  // Estados para edição
  const [editForm, setEditForm] = useState({
    titulo: '',
    mensagem: '',
    horario: '',
    link: '',
    icone: '',
    usuario: '',
    tipo: '',
    repete: '',
    intervalo: '',
    setores: [],
    ativo: true
  });

  // Adicionar estados para modal de usuários online
  const [modalUsuarios, setModalUsuarios] = useState(false);
  const [usuariosOnline, setUsuariosOnline] = useState([]);

  const tiposNotificacao = ['imediata', 'agendada', 'fixa'];
  // const setoresDisponiveis = ['Fiscal', 'Contabil', 'Comercial', 'TI', 'Financeiro', 'DP', 'Onboarding'];
  const setoresDisponiveis = ['ADMIN', 'BPO', 'COMERCIAL', 'CONTABIL', 'DESENVOLVIMENTO', 'DP', 'FINANCEIRO', 'FISCAL', 'MARKETING', 'SOCIETARIO', 'TI', 'OUTROS'];

  // Buscar notificações
  const buscarNotificacoes = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/notificacoes`);
      setNotificacoes(response.data.data || []);
    } catch (err) {
      setError('Erro ao carregar notificações');
      console.error('Erro:', err);
    } finally {
      setLoading(false);
    }
  };

  // Função para buscar usuários online
  const buscarUsuariosOnline = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/notificacoes/usuarios`);
      setUsuariosOnline(response.data);
    } catch (err) {
      setError('Erro ao buscar usuários online');
    }
  };

  useEffect(() => {
    buscarNotificacoes();
  }, []);

  // Formatação de data
  const formatarData = (data) => {
    if (!data) return '-';
    return new Date(data).toLocaleString('pt-BR');
  };

  // Formatação de setores
  const formatarSetores = (setores) => {
    if (!setores) return '-';
     // Se for string, tenta fazer o parse
     let setoresArr = setores;
     if (typeof setores === 'string') {
       try {
         setoresArr = JSON.parse(setores);
       } catch {
         return setores; // Se não for JSON válido, retorna como está
       }
     }
     if (!Array.isArray(setoresArr) || setoresArr.length === 0) return 'Todos';
     return setoresArr.join(', ');
   };
 
   // Cor do chip baseado no tipo
   const getCorTipo = (tipo) => {
     switch (tipo) {
       case 'imediata': return 'success';
       case 'agendada': return 'warning';
       case 'fixa': return 'info';
       default: return 'default';
     }
   };
 
   // Abrir modal de visualização
   const abrirModalView = (notificacao) => {
     setModalView({ open: true, data: notificacao });
   };
 
   // Abrir modal de edição
   const abrirModalEdit = (notificacao) => {
     setEditForm({
     titulo: notificacao.titulo || '',
     mensagem: notificacao.mensagem || '',
     horario: notificacao.horario ? notificacao.horario.slice(0, 16) : null,
     link: notificacao.link || '',
     icone: notificacao.iconeName || '',
     usuario: notificacao.usuario || '',
     tipo: notificacao.tipo || '',
     repete: notificacao.repete || null,
     intervalo: notificacao.intervalo || null,
     setores: notificacao.setoresSelecionados || [],
     ativo: notificacao.ativo !== undefined ? notificacao.ativo : true
   });
     setModalEdit({ open: true, data: notificacao });
   };
 
   // Salvar edição
   const salvarEdicao = async () => {
     try {
       setLoading(true);
 
       const dadosParaSalvar = {
         ...editForm,
         setores: editForm.setores
       };
 
         await axios.put(`${import.meta.env.VITE_API_URL}/api/notificacoes/${modalEdit.data.id}`, dadosParaSalvar);
         setModalEdit({ open: false, data: null });
         buscarNotificacoes();
   
         // Atualizar via WebSocket se disponível
         if (ws?.current?.readyState === 1) {
           ws.current.send(JSON.stringify({ type: 'notificationUpdated' }));
         }
   
         // Mostrar mensagem de sucesso
         setSuccessMessage('Notificação atualizada com sucesso!');
         setTimeout(() => setSuccessMessage(''), 3000);
   
       } catch (err) {
         setError('Erro ao salvar alterações');
         console.error('Erro:', err);
       } finally {
         setLoading(false);
       }
     };
   
     // Confirmar exclusão
     const confirmarExclusao = async () => {
       try {
         setLoading(true);
   
         await axios.delete(`${import.meta.env.VITE_API_URL}/api/notificacoes/${modalDelete.id}`);
   
   
         setModalDelete({ open: false, id: null });
         buscarNotificacoes();
   
         // Atualizar via WebSocket se disponível
         if (ws?.current?.readyState === 1) {
           ws.current.send(JSON.stringify({ type: 'notificationDeleted' }));
         }
       } catch (err) {
         setError('Erro ao excluir notificação');
         console.error('Erro:', err);
       } finally {
         setLoading(false);
       }
     };
   
     // Alternar status ativo/inativo
     const alternarStatus = async (notificacao) => {
     try {
       const novoStatus = !notificacao.ativo;
   
       await axios.put(`${import.meta.env.VITE_API_URL}/api/notificacoes/${notificacao.id}`, {
         ...notificacao,
         ativo: novoStatus
       });
   
       // Atualizar lista local sem fazer nova requisição
       setNotificacoes(prev =>
         prev.map(n =>
           n.id === notificacao.id
             ? { ...n, ativo: novoStatus }
             : n
            )
          );
      
          // Atualizar via WebSocket se disponível
          if (ws?.current?.readyState === 1) {
            ws.current.send(JSON.stringify({
              type: 'notificationStatusChanged',
              id: notificacao.id,
              ativo: novoStatus
            }));
          }
      
          // Mostrar mensagem de sucesso
          setSuccessMessage(`Notificação ${novoStatus ? 'ativada' : 'desativada'} com sucesso!`);
          setTimeout(() => setSuccessMessage(''), 3000);
      
        } catch (err) {
          setError('Erro ao alterar status da notificação');
          console.error('Erro:', err);
        }
      };
      
      
        // Manipuladores de eventos
        const handleChangePage = (event, newPage) => {
          setPage(newPage);
        };
      
        const handleChangeRowsPerPage = (event) => {
          setRowsPerPage(parseInt(event.target.value, 10));
          setPage(0);
        };
      
        const handleEditFormChange = (field, value) => {
          setEditForm(prev => ({ ...prev, [field]: value }));
        };
      
        // Selecionar/desselecionar notificação
        const toggleSelection = (id) => {
          setSelectedIds(prev =>
            prev.includes(id)
              ? prev.filter(selectedId => selectedId !== id)
              : [...prev, id]
          );
        };
      
        // Selecionar/desselecionar todas
        const toggleSelectAll = () => {
          const currentPageIds = notificacoes
            .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
            .map(n => n.id);
      
          if (selectedIds.length === currentPageIds.length) {
            setSelectedIds([]);
          } else {
            setSelectedIds(currentPageIds);
          }
        };
        return (
          <Box sx={{ mt: 4 }}>
            <Typography variant="h6" gutterBottom>
              Notificações Cadastradas
            </Typography>
      
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}
      
            {successMessage && (
              <Alert severity="success" sx={{ mb: 2 }}>
                {successMessage}
              </Alert>
            )}
      
            {/* Ações em Massa */}
            {selectedIds.length > 0 && (
              <Box sx={{ mb: 2, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
                <Typography variant="body2" gutterBottom>
                  {selectedIds.length} notificação(ões) selecionada(s)
                </Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => setSelectedIds([])}
                  >
                    Limpar Seleção
                  </Button>
                </Box>
              </Box>
            )}
      
            <TableContainer component={Paper} elevation={3}>
              <Table>
                <TableHead sx={{ bgcolor: '#f5f5f5' }}>
                  <TableRow>
                    <TableCell padding="checkbox">
                      <Checkbox
                        indeterminate={selectedIds.length > 0 && selectedIds.length < rowsPerPage}
                        checked={notificacoes.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).length > 0 &&
                                 selectedIds.length === notificacoes.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).length}
                        onChange={toggleSelectAll}
                      />
                    </TableCell>
                    <TableCell>Ícone</TableCell>
                    <TableCell>Título</TableCell>
                    <TableCell>Tipo</TableCell>
                    <TableCell>Usuário</TableCell>
                    <TableCell>Setores</TableCell>
                    <TableCell>Criada em</TableCell>
                    <TableCell>Agendada para</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="center">Ações</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={9} align="center">
                  Carregando...
                </TableCell>
              </TableRow>
            ) : notificacoes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} align="center">
                  Nenhuma notificação encontrada
                </TableCell>
              </TableRow>
            ) : (
              notificacoes
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((notificacao) => {
                  return (
                    <TableRow key={notificacao.id} hover>
                      <TableCell padding="checkbox">
                        <Checkbox
                          checked={selectedIds.includes(notificacao.id)}
                          onChange={() => toggleSelection(notificacao.id)}
                        />
                      </TableCell>
                      <TableCell>
                        <Avatar sx={{ width: 32, height: 32 }}>
                          {notificacao.icone ? (
                            <img
                              src={`./icons/${notificacao.icone}`}
                              alt="Ícone"
                              style={{ width: '100%', height: '100%' }}
                            />
                          ) : (
                            <NotificationsIcon />
                          )}
                        </Avatar>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          {notificacao.titulo || 'Sem título'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {notificacao.mensagem?.substring(0, 50)}
                          {notificacao.mensagem?.length > 50 && '...'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={notificacao.tipo}
                          color={getCorTipo(notificacao.tipo)}
                          size="small"
                          icon={notificacao.tipo === 'agendada' || notificacao.tipo === 'fixa' ? <ScheduleIcon /> : undefined}
                        />
                      </TableCell>
                      <TableCell>{notificacao.usuario || 'Todos'}</TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {formatarSetores(notificacao.setores || 'Todos')}
                          </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {formatarData(notificacao.createdAt)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {formatarData(notificacao.agendadaPara)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Switch
                            checked={notificacao.ativo}
                            onChange={() => alternarStatus(notificacao)}
                            color="success"
                            size="small"
                          />
                          <Chip
                            label={notificacao.ativo ? 'Ativo' : 'Inativo'}
                            color={notificacao.ativo ? 'success' : 'default'}
                            size="small"
                            variant="outlined"
                          />
                        </Box>
                      </TableCell>
                      <TableCell align="center">
                        <Tooltip title="Visualizar">
                          <IconButton
                            size="small"
                            onClick={() => abrirModalView(notificacao)}
                          >
                            <ViewIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Editar">
                          <IconButton
                            size="small"
                            onClick={() => abrirModalEdit(notificacao)}
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title={notificacao.ativo ? 'Desativar' : 'Ativar'}>
                          <IconButton
                            size="small"
                            onClick={() => alternarStatus(notificacao)}
                            color={notificacao.ativo ? 'success' : 'default'}
                          >
                            <PowerIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Excluir">
                          <IconButton
                            size="small"
                            onClick={() => setModalDelete({ open: true, id: notificacao.id })}
                            color="error"
                            >
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                        {notificacao.link && (
                          <Tooltip title="Abrir Link">
                            <IconButton
                              size="small"
                              onClick={() => window.open(notificacao.link, '_blank')}
                            >
                              <LinkIcon />
                            </IconButton>
                          </Tooltip>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
            )}
          </TableBody>
        </Table>

        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={notificacoes.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelRowsPerPage="Linhas por página:"
          labelDisplayedRows={({ from, to, count }) =>
            `${from}-${to} de ${count !== -1 ? count : `mais de ${to}`}`
          }
        />
      </TableContainer>

      {/* Modal de Visualização */}
      <Dialog open={modalView.open} onClose={() => setModalView({ open: false, data: null })} maxWidth="md" fullWidth>
        <DialogTitle>Detalhes da Notificação</DialogTitle>
        <DialogContent>
          {modalView.data && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar>
                  {modalView.data.icone ? (
                    <img src={`./icons/${modalView.data.icone}`} alt="Ícone" style={{ width: '100%' }} />
                  ) : (
                    <NotificationsIcon />
                  )}
                </Avatar>
                <Typography variant="h6">{modalView.data.titulo || 'Sem título'}</Typography>
              </Box>
              <Typography><strong>Mensagem:</strong> {modalView.data.mensagem}</Typography>
              <Typography><strong>Tipo:</strong> {modalView.data.tipo}</Typography>
              <Typography><strong>Usuário:</strong> {modalView.data.usuario || '-'}</Typography>
              <Typography><strong>Setores:</strong> {formatarSetores(modalView.data.setores)}</Typography>
              <Typography><strong>Horário:</strong> {formatarData(modalView.data.horario)}</Typography>
              {modalView.data.link && (
                 <Typography>
                 <strong>Link:</strong>
                 <a href={modalView.data.link} target="_blank" rel="noopener noreferrer">
                   {modalView.data.link}
                 </a>
               </Typography>
             )}
             <Typography><strong>Repetições:</strong> {modalView.data.repete || 1}</Typography>
             <Typography><strong>Intervalo:</strong> {modalView.data.intervalo || 5} minutos</Typography>
           </Box>
         )}
       </DialogContent>
       <DialogActions>
         <Button onClick={() => setModalView({ open: false, data: null })}>Fechar</Button>
       </DialogActions>
     </Dialog>

     {/* Modal de Edição */}
     <Dialog open={modalEdit.open} onClose={() => setModalEdit({ open: false, data: null })} maxWidth="md" fullWidth>
       <DialogTitle>Editar Notificação</DialogTitle>
       <DialogContent>
         <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
           <TextField
             fullWidth
             label="Título"
             value={editForm.titulo}
             onChange={(e) => handleEditFormChange('titulo', e.target.value)}
           />
           <TextField
             fullWidth
             label="Mensagem"
             multiline
             rows={3}
             value={editForm.mensagem}
             onChange={(e) => handleEditFormChange('mensagem', e.target.value)}
           />
           <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
             <TextField
               fullWidth
               label="Usuário"
               value={editForm.usuario}
               onChange={(e) => handleEditFormChange('usuario', e.target.value)}
             />
             <Button
               variant="outlined"
               size="small"
               onClick={() => {
                 buscarUsuariosOnline();
                 setModalUsuarios(true);
               }}
             >
               Buscar Online
             </Button>
           </Box>
           <FormControl fullWidth>
             <InputLabel>Tipo</InputLabel>
             <Select
               value={editForm.tipo}
               label="Tipo"
               onChange={(e) => handleEditFormChange('tipo', e.target.value)}
               >
                 {tiposNotificacao.map((tipo) => (
                   <MenuItem key={tipo} value={tipo}>{tipo}</MenuItem>
                 ))}
               </Select>
             </FormControl>
             <TextField
               fullWidth
               label="Horário"
               type="datetime-local"
               value={editForm.horario || ''}
               onChange={(e) => handleEditFormChange('horario', e.target.value)}
               InputLabelProps={{ shrink: true }}
             />
             <TextField
               fullWidth
               label="Link"
               value={editForm.link}
               onChange={(e) => handleEditFormChange('link', e.target.value)}
             />
             <FormControlLabel
               control={
                 <Switch
                   checked={editForm.ativo !== undefined ? editForm.ativo : true}
                   onChange={(e) => handleEditFormChange('ativo', e.target.checked)}
                   color="success"
                 />
               }
               label="Notificação Ativa"
             />
           </Box>
         </DialogContent>
         <DialogActions>
           <Button onClick={() => setModalEdit({ open: false, data: null })}>Cancelar</Button>
           <Button onClick={salvarEdicao} variant="contained" disabled={loading}>
             Salvar
           </Button>
         </DialogActions>
       </Dialog>
 
       {/* Modal de Confirmação de Exclusão */}
       <Dialog open={modalDelete.open} onClose={() => setModalDelete({ open: false, id: null })}>
         <DialogTitle>Confirmar Exclusão</DialogTitle>
         <DialogContent>
           <Typography>Tem certeza que deseja excluir esta notificação?</Typography>
         </DialogContent>
         <DialogActions>
           <Button onClick={() => setModalDelete({ open: false, id: null })}>Cancelar</Button>
           <Button onClick={confirmarExclusao} color="error" variant="contained" disabled={loading}>
             Excluir
           </Button>
         </DialogActions>
       </Dialog>
 
       {/* Modal de Seleção de Usuário Online */}
       <Dialog open={modalUsuarios} onClose={() => setModalUsuarios(false)} maxWidth="xs" fullWidth>
         <DialogTitle>Usuários Online</DialogTitle>
         <DialogContent>
         {usuariosOnline.length === 0 ? (
            <Typography>Nenhum usuário online.</Typography>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {usuariosOnline.map((user, idx) => (
                <Button
                  key={idx}
                  variant="outlined"
                  onClick={() => {
                    handleEditFormChange('usuario', user.usuario);
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
    </Box>
  );
};

export default TabelaNotificacoes;