import { Grid, TextField } from '@mui/material';

const CamposNotificacao = ({ form, onChange }) => (
  <>
    <Grid item xs={12} sm={6}>
      <TextField fullWidth size="small" label="Título"
        value={form.titulo}
        onChange={(e) => onChange('titulo', e.target.value)} />
    </Grid>
    <Grid item xs={12}>
      <TextField fullWidth size="small" label="Mensagem"
        value={form.mensagem}
        onChange={(e) => onChange('mensagem', e.target.value)} />
    </Grid>
    <Grid item xs={12} sm={6}>
      <TextField
        sx={{ width: '223px' }}
        size="small"
        label="Horário (para agendada/fixa)"
        type="datetime-local"
        InputLabelProps={{ shrink: true }}
        value={form.horario}
        onChange={(e) => onChange('horario', e.target.value)} />
    </Grid>
    <Grid item xs={12} sm={6}>
      <TextField fullWidth size="small" label="Link (opcional)"
        value={form.link}
        onChange={(e) => onChange('link', e.target.value)} />
    </Grid>
    <Grid item xs={12} sm={6}>
      <TextField fullWidth size="small" label="Número de repetições"
        type="number"
        value={form.repete}
        onChange={(e) => onChange('repete', e.target.value)} />
    </Grid>
    <Grid item xs={12} sm={6}>
      <TextField fullWidth size="small" label="Intervalo entre repetições (minutos)"
        type="number"
        value={form.intervalo}
        onChange={(e) => onChange('intervalo', e.target.value)} />
    </Grid>
  </>
);

export default CamposNotificacao;