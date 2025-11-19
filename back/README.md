# Sistema de Notificações - API

API RESTful para gerenciamento de notificações usando Express.js e MySQL.

## Configuração do Banco de Dados

1. Configure suas credenciais do MySQL no arquivo `database.js`:
```javascript
const dbConfig = {
  host: 'localhost',
  user: 'seu_usuario',
  password: 'sua_senha',
  database: 'notificacoes_db'
};
```

2. Execute a aplicação para criar automaticamente o banco e as tabelas:
```bash
npm install
npm run dev
```

## Estrutura da Tabela

```sql
CREATE TABLE notificacoes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  titulo VARCHAR(255),
  mensagem TEXT NOT NULL,
  usuario VARCHAR(255),
  tipo ENUM('imediata', 'agendada', 'fixa') NOT NULL,
  horario DATETIME,
  icone VARCHAR(255),
  link VARCHAR(500),
  setores JSON,
  ativo BOOLEAN DEFAULT TRUE,
  agendadaPara DATETIME,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

## Rotas da API

Todas as rotas seguem o padrão do arquivo `mock.js` e retornam objetos no formato:
```json
{
  "data": {...},
  "status": 200
}
```

### 1. Listar Todas as Notificações
**GET** `/api/notificacoes`

Retorna todas as notificações ordenadas por data de criação (mais recentes primeiro).

**Resposta:**
```json
{
  "data": [
    {
      "id": 1,
      "titulo": "Título da notificação",
      "mensagem": "Mensagem da notificação",
      "usuario": "admin",
      "tipo": "imediata",
      "setores": ["TI", "RH"],
      "ativo": true,
      "createdAt": "2024-01-01T10:00:00Z"
    }
  ],
  "status": 200
}
```

### 2. Buscar Notificação por ID
**GET** `/api/notificacoes/:id`

Retorna uma notificação específica pelo ID.

**Resposta de sucesso:**
```json
{
  "data": {
    "id": 1,
    "titulo": "Título da notificação",
    "mensagem": "Mensagem da notificação",
    // ... outros campos
  },
  "status": 200
}
```

**Resposta de erro (404):**
```json
{
  "data": { "message": "Notificação não encontrada" },
  "status": 404
}
```

### 3. Criar Nova Notificação
**POST** `/api/notificacoes`

Cria uma ou múltiplas notificações com suporte a repetição e agendamento.

**Body:**
```json
{
  "titulo": "Título da notificação",
  "mensagem": "Mensagem da notificação",
  "usuario": "admin",
  "tipo": "imediata", // ou "agendada" ou "fixa"
  "horario": "2024-01-01T10:00:00Z", // opcional
  "icone": "info", // opcional
  "link": "https://exemplo.com", // opcional
  "setores": ["TI", "RH"], // opcional
  "repete": 3, // opcional, padrão 1
  "intervalo": 5 // opcional, em minutos, padrão 5
}
```

**Resposta:**
```json
{
  "data": {
    "id": 1,
    "titulo": "Título da notificação",
    "mensagem": "Mensagem da notificação",
    // ... dados da notificação criada
  },
  "status": 201
}
```

### 4. Atualizar Notificação
**PUT** `/api/notificacoes/:id`

Atualiza uma notificação existente.

**Body:** (apenas os campos que deseja alterar)
```json
{
  "titulo": "Novo título",
  "ativo": false
}
```

**Resposta:**
```json
{
  "data": {
    "id": 1,
    "titulo": "Novo título",
    "ativo": false,
    // ... dados atualizados
  },
  "status": 200
}
```

### 5. Excluir Notificação
**DELETE** `/api/notificacoes/:id`

Exclui uma notificação.

**Resposta:**
```json
{
  "data": {
    "message": "Notificação excluída com sucesso",
    "notificacao": {
      // ... dados da notificação excluída
    }
  },
  "status": 200
}
```

### 6. Buscar com Filtros
**GET** `/api/notificacoes/filtros/search`

Busca notificações aplicando filtros via query parameters.

**Query Parameters:**
- `tipo`: Filtrar por tipo (imediata, agendada, fixa)
- `ativo`: Filtrar por status ativo (true/false)
- `setor`: Filtrar por setor
- `usuario`: Buscar por nome do usuário (busca parcial)
- `busca`: Buscar no título e mensagem (busca parcial)

**Exemplo:**
```
GET /api/notificacoes/filtros/search?tipo=imediata&ativo=true&usuario=admin
```

**Resposta:**
```json
{
  "data": [
    // ... notificações que atendem aos filtros
  ],
  "status": 200
}
```

### 7. Estatísticas do Dashboard
**GET** `/api/notificacoes/stats/dashboard`

Retorna estatísticas consolidadas para dashboard.

**Resposta:**
```json
{
  "data": {
    "total": 100,
    "ativas": 85,
    "inativas": 15,
    "porTipo": {
      "imediata": 60,
      "agendada": 30,
      "fixa": 10
    },
    "porSetor": {
      "TI": 40,
      "RH": 30,
      "Financeiro": 20,
      "Todos": 10
    },
    "recentes": [
      // ... últimas 5 notificações criadas
    ]
  },
  "status": 200
}
```

## Tratamento de Erros

Todas as rotas implementam tratamento de erros e retornam:

- **400**: Dados inválidos ou obrigatórios ausentes
- **404**: Notificação não encontrada
- **500**: Erro interno do servidor

## Campos Obrigatórios

- `mensagem`: Sempre obrigatório
- `tipo`: Sempre obrigatório (deve ser: 'imediata', 'agendada' ou 'fixa')

## Recursos Especiais

1. **Repetição de Notificações**: Use `repete` e `intervalo` para criar múltiplas notificações
2. **Agendamento**: Para tipos 'agendada' e 'fixa', defina `horario`
3. **Setores JSON**: O campo `setores` é armazenado como JSON no banco
4. **Busca Flexível**: A rota de filtros permite busca por múltiplos critérios
5. **Timestamps Automáticos**: `createdAt` e `updatedAt` são gerenciados automaticamente

## WebSocket

O servidor também inclui um WebSocket básico na porta 3000 para notificações em tempo real. 