import { Box, TextField, Paper, Button, Dialog, DialogTitle, DialogContent, DialogActions, Typography  } from '@mui/material';
import {useState} from 'react';

const DefineIcon = ({handleMudarIcone}) => {

  const [open, setOpen] = useState(false);

  const iconModules = import.meta.glob('../src/icons/*.{svg,png,jpg,jpeg,gif}', { eager: true });

  const icons = Object.entries(iconModules).map(([path, module]) => {
    const name = path.split('/').pop();
    return {
      name,
      url: module.default
    };
  });

 const iconePadrao = icons.find(icon => icon.name === 'logo.png')?.url || icons[0]?.url || '';
const [iconeSelecionado, setIconeSelecionado] = useState(iconePadrao);
  const handleClick = (iconName) => {
    console.log('Ícone clicado:', iconName);
    const icon = icons.find(i => i.name === iconName);
    handleMudarIcone(iconName);
    setIconeSelecionado(icon.url); // Use a URL gerada pelo Vite!
    // aqui você pode usar setState, enviar para outro componente, etc.
  };

return (
  <>
    <Box display="flex" alignItems="center" gap={1} mt={2}>
      <Button variant='contained' size='medium' onClick={() => setOpen(true)}>Alterar ICONE</Button>
      <img src={iconeSelecionado} alt="ícone" style={{ width: 24, height: 24 }} />
    </Box>

    <Dialog open={open} onClose={() => setOpen(false)}>
      <DialogTitle>SELECIONAR ICONE</DialogTitle>
      <DialogContent>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          {icons.map(icon => (
            <div
              key={icon.name}
              style={{ textAlign: 'center', cursor: 'pointer' }}
              onClick={() => {
                handleClick(icon.name);
                setOpen(false); // fecha após selecionar
              }}
            >
              <img src={icon.url} alt={icon.name} style={{ width: 48, height: 48 }} />
            </div>
          ))}
        </div>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setOpen(false)} color="primary">
          Fechar
        </Button>
      </DialogActions>
    </Dialog>
  </>
    );
  };
  
  export default DefineIcon;