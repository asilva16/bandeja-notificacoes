import { Button } from '@mui/material';

const BotaoEnviar = ({ disabled, onClick }) => (
  <Button onClick={onClick} variant="contained" disabled={disabled}>
    Enviar Notificação
  </Button>
);

export default BotaoEnviar;