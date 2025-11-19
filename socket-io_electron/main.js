const { app, Tray, Menu, Notification, shell } = require('electron');
const io = require('socket.io-client'); 
const path = require('path');
const os = require('os');

app.setAppUserModelId('notificacoes-contabilita');
app.setName('Notificações Contabilità');


let tray = null;
let socket = null;
let notificacoesPausadas = false;
let notificacaoAtual = null;

const nomeUsuario = os.userInfo().username;
const nomeMaquina = os.hostname();

function atualizarMenuTray() {
  const contextMenu = Menu.buildFromTemplate([

  ]);
  tray.setContextMenu(contextMenu);
}

function createTray() {
  tray = new Tray(path.join(__dirname, 'icon.png'));
  tray.setToolTip('Notificador Bandeja');
  atualizarMenuTray();
}

function conectarSocket() {
  console.log('Tentando conectar via Socket.IO...');

  socket = io('http://x.x.x.x:3000', {
    reconnectionAttempts: Infinity, // Tentativas ilimitadas
    reconnectionDelay: 1000, // 1s inicial
    reconnectionDelayMax: 30000, // Máx 30s
    timeout: 20000, // Tempo de timeout de conexão
    transports: ['websocket']
  });

  socket.on('connect', () => {
    console.log('Socket.IO conectado');

    // Envia identificação após conectar
    socket.emit('identificar', {
      userId: nomeMaquina,
      nome: nomeUsuario,
      setor: null // Se usar setor, preencha aqui
    });
  });

  socket.on('disconnect', (reason) => {
    console.log(`Desconectado: ${reason}`);
  });

  socket.on('connect_error', (err) => {
    console.error('Erro de conexao Socket.IO:', err.message);
  });

  // Recebe mensagens de notificação
  socket.on('nova_mensagem', (notificationData) => {
    if (notificacoesPausadas) {
      console.log('Notificação recebida, mas está pausada:', notificationData);
      return;
    }
    console.log('Notificacaoo recebida:', notificationData);

    const title = notificationData.titulo;
    const body = notificationData.mensagem || notificationData.body || '';
    const icon = path.join(__dirname, 'icones', notificationData.icone || 'icon.png');
    const link = notificationData.link;

    const noti = new Notification({
      title,
      body,
      icon,
    });

    noti.id = notificationData.id;

    console.log('Exibindo notificação:', notificationData);
    notificacaoAtual = noti;
    console.log('notificacaoAtual setada:', notificacaoAtual);
    atualizarMenuTray();

    noti.on('click', () => {
      if (link) {
        shell.openExternal(link);
      }
      
    });

    noti.on('close', () => {
      console.log('Notificação fechada');
      notificacaoAtual = null;
      atualizarMenuTray();
    });

    noti.show();
  });

  // Mensagem de boas-vindas
  socket.on('conectado', (data) => {
    console.log('Mensagem do servidor:', data);
  });
}

app.whenReady().then(() => {
  app.setLoginItemSettings({
    openAtLogin: true, // inicia com o Windows
    path: process.execPath // caminho do executável
  });
  createTray();
  conectarSocket();
});
