import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  LinearProgress,
  Avatar
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  Schedule as ScheduleIcon,
  CheckCircle as CheckCircleIcon,
  Person as PersonIcon,
  Business as BusinessIcon
} from '@mui/icons-material';
import axios from 'axios';


const EstatisticasNotificacoes = () => {
  const [stats, setStats] = useState({
    total: 0,
    imediatas: 0,
    agendadas: 0,
    fixas: 0,
    ativas: 0,
    inativas: 0,
    porSetor: {},
    recentes: []
  });
  const [loading, setLoading] = useState(false);

  const buscarEstatisticas = async () => {
    setLoading(true);
    try {

      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/notificacoes`);

      const notificacoes = response.data.data || [];

      // Calcular estatísticas
      const total = notificacoes.length;
      const imediatas = notificacoes.filter(n => n.tipo === 'imediata').length;
      const agendadas = notificacoes.filter(n => n.tipo === 'agendada').length;
      const fixas = notificacoes.filter(n => n.tipo === 'fixa').length;
      const ativas = notificacoes.filter(n => n.ativo === 1).length;
      const inativas = total - ativas;

      // Estatísticas por setor
      const porSetor = {};

      notificacoes.forEach(n => {
        if (Array.isArray(n.setores) && n.setores.length > 0) {
          n.setores.forEach(setor => {
            porSetor[setor] = (porSetor[setor] || 0) + 1;
          });
        } else {
          porSetor['Sem Setor'] = (porSetor['Sem Setor'] || 0) + 1;
        }
      });

      const stats = {
        total: notificacoes.length,
        porSetor
      };



      // Notificações recentes (últimas 5)
      const recentes = notificacoes
        .sort((a, b) => new Date(b.createdAt || b.horario) - new Date(a.createdAt || a.horario))
        .slice(0, 5);

      setStats({
        total,
        imediatas,
        agendadas,
        fixas,
        ativas,
        inativas,
        porSetor,
        recentes
      });
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    buscarEstatisticas();
  }, []);

  const StatCard = ({ title, value, icon, color = 'primary', subtitle }) => (
    <Card elevation={2} sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Avatar sx={{ bgcolor: `${color}.light`, mr: 2 }}>
            {icon}
          </Avatar>
          <Box>
            <Typography variant="h4" color={`${color}.main`} fontWeight="bold">
              {value}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {title}
            </Typography>
            {subtitle && (
              <Typography variant="caption" color="text.secondary">
                {subtitle}
              </Typography>
            )}
          </Box>
        </Box>
        </CardContent>
    </Card>
  );

  const getPercentage = (value, total) => {
  if (!total || total === 0) return 0;
  return Math.round((value / total) * 100);
};


  if (loading) {
    return (
      <Box sx={{ mt: 2 }}>
        <Typography variant="h6" gutterBottom>Dashboard - Estatísticas</Typography>
        <LinearProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ mt: 2 }}>
      <Typography variant="h6" gutterBottom sx={{ mb: 3 }}>
        Dashboard - Estatísticas das Notificações
      </Typography>

      <Grid container spacing={3}>
        {/* Cards de Estatísticas Principais */}
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total de Notificações"
            value={stats.total}
            icon={<NotificationsIcon />}
            color="primary"
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Notificações Ativas"
            value={stats.ativas}
            icon={<CheckCircleIcon />}
            color="success"
            subtitle={`${getPercentage(stats.ativas, stats.total).toFixed(1)}% do total`}
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Agendadas"
            value={stats.agendadas}
            icon={<ScheduleIcon />}
            color="warning"
            subtitle={`${getPercentage(stats.agendadas, stats.total).toFixed(1)}% do total`}
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Fixas"
            value={stats.fixas}
            icon={<BusinessIcon />}
            color="info"
            subtitle={`${getPercentage(stats.fixas, stats.total).toFixed(1)}% do total`}
          />
        </Grid>

        {/* Gráfico de Tipos */}
        <Grid item xs={12} md={6}>
          <Card elevation={2}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Distribuição por Tipo
              </Typography>
              <Box sx={{ mt: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">Imediatas</Typography>
                  <Typography variant="body2">{stats.imediatas}</Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={getPercentage(stats.imediatas, stats.total)}
                  color="success"
                  sx={{ mb: 2 }}
                />

                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">Agendadas</Typography>
                  <Typography variant="body2">{stats.agendadas}</Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={getPercentage(stats.agendadas, stats.total)}
                  color="warning"
                  sx={{ mb: 2 }}
                />

                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">Fixas</Typography>
                  <Typography variant="body2">{stats.fixas}</Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={getPercentage(stats.fixas, stats.total)}
                  color="info"
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Distribuição por Setor */}
        <Grid item xs={12} md={6}>
          <Card elevation={2}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Distribuição por Setor
              </Typography>
              <Box sx={{ mt: 2 }}>
                {Object.entries(stats.porSetor)
                  .sort(([,a], [,b]) => b - a)
                  .slice(0, 6)
                  .map(([setor, count]) => (
                    <Box key={setor} sx={{ mb: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2">{setor}</Typography>
                        <Chip
                          label={count}
                          size="small"
                          color="primary"
                          variant="outlined"
                        />
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={getPercentage(count, stats.total)}
                        color="primary"
                      />
                    </Box>
                  ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Notificações Recentes */}
        <Grid item xs={12}>
          <Card elevation={2}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Notificações Recentes
              </Typography>
              {stats.recentes.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  Nenhuma notificação encontrada
                </Typography>
              ) : (
                <Box sx={{ mt: 2 }}>
                  {stats.recentes.map((notificacao, index) => (
                    <Box
                      key={notificacao.id || index}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        p: 2,
                        borderBottom: index < stats.recentes.length - 1 ? '1px solid #eee' : 'none'
                      }}
                    >
                      <Avatar sx={{ mr: 2, width: 32, height: 32 }}>
                        {notificacao.icone ? (
                          <img
                            src={`./icons/${notificacao.icone}`}
                            alt="Ícone"
                            style={{ width: '100%', height: '100%' }}
                          />
                        ) : (
                          <NotificationsIcon fontSize="small" />
                        )}
                        </Avatar>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="body2" fontWeight="medium">
                            {notificacao.titulo || 'Sem título'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {notificacao.mensagem?.substring(0, 80)}
                            {notificacao.mensagem?.length > 80 && '...'}
                          </Typography>
                        </Box>
                        <Box sx={{ textAlign: 'right' }}>
                          <Chip
                            label={notificacao.tipo}
                            size="small"
                            color={
                              notificacao.tipo === 'imediata' ? 'success' :
                              notificacao.tipo === 'agendada' ? 'warning' : 'info'
                            }
                            variant="outlined"
                          />
                          <Typography variant="caption" display="block" sx={{ mt: 0.5 }}>
                            {notificacao.usuario || 'Sistema'}
                          </Typography>
                        </Box>
                      </Box>
                    ))}
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    );
  };
  
  export default EstatisticasNotificacoes;