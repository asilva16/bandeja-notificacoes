import { Grid, FormControl, InputLabel, Select, MenuItem, Checkbox, ListItemText, Box } from '@mui/material';

const SelecaoSetoresETipo = ({ form, onChange, setoresDisponiveis, renderIconButton }) => (
  <>
    <Grid item xs={12} sm={6}>
      <FormControl size="small" sx={{ width: '223px' }}>
        <InputLabel id="setores-label">Setores</InputLabel>
        <Select
          labelId="setores-label"
          multiple
          value={form.setoresSelecionados}
          label="Setores"
          onChange={(e) => onChange('setoresSelecionados', e.target.value)}
          renderValue={(selected) => selected.join(', ')}
        >
          {setoresDisponiveis.map((setor) => (
            <MenuItem key={setor} value={setor}>
              <Checkbox checked={form.setoresSelecionados.indexOf(setor) > -1} />
              <ListItemText primary={setor} />
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Grid>

    <Grid item xs={12} sm={6}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <FormControl size="small" sx={{ width: '223px' }}>
          <InputLabel id="tipo-label">Tipo de Notificação</InputLabel>
          <Select
            labelId="tipo-label"
            value={form.tipo}
            label="Tipo de Notificação"
            onChange={(e) => onChange('tipo', e.target.value)}
          >
            <MenuItem value="imediata">Imediata</MenuItem>
            <MenuItem value="agendada">Agendada</MenuItem>
            <MenuItem value="fixa">Fixa</MenuItem>
          </Select>
        </FormControl>
        {renderIconButton}
      </Box>
    </Grid>
  </>
);

export default SelecaoSetoresETipo;