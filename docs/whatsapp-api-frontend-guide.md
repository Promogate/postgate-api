# WhatsApp API - Guia para Desenvolvimento Frontend

## Visão Geral

Este documento serve como guia completo para o desenvolvimento de interfaces frontend que consomem a API WhatsApp do PostGate. A API gerencia sessões do WhatsApp, envio de mensagens e sincronização de chats.

## Arquitetura da API

### Controller Principal

- **Arquivo**: `src/app/controllers/WhatsappController.ts`
- **Responsabilidade**: Gerenciar todas as operações relacionadas ao WhatsApp
- **Padrão**: Controller com métodos privados para cada endpoint

### Serviços Utilizados

- `CodechatService`: Engine principal para WhatsApp
- `EvolutionService`: Engine alternativo
- `WhatsappSessionsService`: Gerenciamento de sessões
- `SaveManyWhatsappChats`: Sincronização de chats

## Endpoints da API

### 1. Criar Sessão WhatsApp

**Endpoint**: `POST /whatsapp/session/create`
**Autenticação**: Bearer Token obrigatório

#### Request Body

```typescript
interface CreateSessionRequest {
  name: string; // Nome da sessão
  description: string; // Descrição da sessão
}
```

#### Response

- **200**: Sessão criada com sucesso
- **400**: Erro na criação

#### Implementação Frontend

```typescript
const createSession = async (sessionData: CreateSessionRequest) => {
  const response = await fetch("/whatsapp/session/create", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(sessionData),
  });

  if (!response.ok) {
    throw new Error("Erro ao criar sessão");
  }

  return response;
};
```

### 2. Listar Sessões do Usuário

**Endpoint**: `GET /whatsapp/sessions`
**Autenticação**: Bearer Token obrigatório

#### Request Body

```typescript
interface GetSessionsRequest {
  token: string; // Token do WhatsApp API
}
```

#### Response

```typescript
interface SessionResponse {
  id: string;
  userId: string;
  name: string;
  description: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}
```

#### Implementação Frontend

```typescript
const getSessions = async (whatsappToken: string) => {
  const response = await fetch("/whatsapp/sessions", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ token: whatsappToken }),
  });

  if (!response.ok) {
    throw new Error("Erro ao buscar sessões");
  }

  return response.json();
};
```

### 3. Obter QR Code

**Endpoint**: `GET /whatsapp/qrcode/:instanceId`
**Autenticação**: Bearer Token obrigatório

#### Parâmetros

- `instanceId`: ID da instância da sessão

#### Request Body

```typescript
interface QRCodeRequest {
  token: string; // Token do WhatsApp API
}
```

#### Response

```typescript
interface QRCodeResponse {
  qrcode: string; // Base64 do QR Code
  base64: string; // Imagem do QR Code
}
```

#### Implementação Frontend

```typescript
const getQRCode = async (instanceId: string, whatsappToken: string) => {
  const response = await fetch(`/whatsapp/qrcode/${instanceId}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ token: whatsappToken }),
  });

  if (!response.ok) {
    throw new Error("Erro ao obter QR Code");
  }

  return response.json();
};
```

### 4. Sincronizar Chats

**Endpoint**: `GET /whatsapp/sync_chats/:instanceId`
**Autenticação**: Bearer Token obrigatório

#### Parâmetros

- `instanceId`: ID da instância da sessão

#### Request Body

```typescript
interface SyncChatsRequest {
  token: string; // Token do WhatsApp API
  chats: Chat[]; // Array de chats para sincronizar
}
```

#### Response

```typescript
interface SyncResponse {
  message: string; // "Processado com sucesso!"
}
```

#### Implementação Frontend

```typescript
const syncChats = async (
  instanceId: string,
  chats: Chat[],
  whatsappToken: string
) => {
  const response = await fetch(`/whatsapp/sync_chats/${instanceId}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      token: whatsappToken,
      chats: chats,
    }),
  });

  if (!response.ok) {
    throw new Error("Erro ao sincronizar chats");
  }

  return response.json();
};
```

### 5. Enviar Mensagem de Mídia

**Endpoint**: `POST /whatsapp/send_media_message/:instanceId`
**Autenticação**: Bearer Token obrigatório

#### Parâmetros

- `instanceId`: ID da instância da sessão

#### Request Body

```typescript
interface MediaMessage {
  number: string; // Número do destinatário
  media: {
    type: string; // Tipo da mídia (image, video, audio, document)
    url: string; // URL da mídia
    caption?: string; // Legenda opcional
  };
  delay?: number; // Delay em milissegundos
}
```

#### Response

```typescript
interface MessageResponse {
  success: boolean;
  messageId: string;
  timestamp: number;
}
```

#### Implementação Frontend

```typescript
const sendMediaMessage = async (instanceId: string, message: MediaMessage) => {
  const response = await fetch(`/whatsapp/send_media_message/${instanceId}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(message),
  });

  if (!response.ok) {
    throw new Error("Erro ao enviar mensagem de mídia");
  }

  return response.json();
};
```

### 6. Enviar Mensagem de Texto

**Endpoint**: `POST /whatsapp/send_text_message/:instanceId`
**Autenticação**: Bearer Token obrigatório

#### Parâmetros

- `instanceId`: ID da instância da sessão

#### Request Body

```typescript
interface RequestTextMessage {
  number: string; // Número do destinatário
  message: {
    text: string; // Texto da mensagem
    delay?: number; // Delay em milissegundos
    linkPreview?: boolean; // Habilitar preview de links
    mentionsEveryOne?: boolean; // Mencionar todos
  };
}
```

#### Response

```typescript
interface MessageResponse {
  success: boolean;
  messageId: string;
  timestamp: number;
}
```

#### Implementação Frontend

```typescript
const sendTextMessage = async (
  instanceId: string,
  message: RequestTextMessage
) => {
  const response = await fetch(`/whatsapp/send_text_message/${instanceId}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(message),
  });

  if (!response.ok) {
    throw new Error("Erro ao enviar mensagem de texto");
  }

  return response.json();
};
```

### 7. Deletar Sessão

**Endpoint**: `DELETE /whatsapp/session/:sessionId`
**Autenticação**: Bearer Token obrigatório

#### Parâmetros

- `sessionId`: ID da sessão a ser deletada

#### Response

- **200**: Sessão deletada com sucesso
- **422**: Session ID não fornecido
- **400**: Erro na deleção

#### Implementação Frontend

```typescript
const deleteSession = async (sessionId: string) => {
  const response = await fetch(`/whatsapp/session/${sessionId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Erro ao deletar sessão");
  }

  return response;
};
```

### 8. Buscar Grupos de uma Instância

**Endpoint**: `GET /whatsapp/chats/:instanceId`
**Autenticação**: Bearer Token obrigatório

#### Parâmetros

- `instanceId`: ID da instância da sessão

#### Request Body

```typescript
interface GetGroupsRequest {
  token: string; // Token do WhatsApp API
}
```

#### Response

```typescript
interface GroupResponse {
  id: string; // ID único do grupo
  subject: string; // Nome do grupo
  subjectOwner: string; // Proprietário do grupo
  subjectTime: number; // Timestamp da última alteração do nome
  pictureUrl: string | null; // URL da foto do grupo
  size: number; // Número de participantes
  creation: number; // Timestamp de criação do grupo
  owner: string; // ID do proprietário
  desc: string; // Descrição do grupo
  descOwner: string; // Proprietário da descrição
  descTime: number; // Timestamp da última alteração da descrição
  restrict: boolean; // Se o grupo é restrito
  announce: boolean; // Se o grupo tem anúncios
  participants: any[]; // Lista de participantes (se getParticipants=true)
}
```

#### Implementação Frontend

```typescript
const getGroups = async (instanceId: string, whatsappToken: string) => {
  const response = await fetch(`/whatsapp/chats/${instanceId}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ token: whatsappToken }),
  });

  if (!response.ok) {
    throw new Error("Erro ao buscar grupos");
  }

  return response.json();
};
```

## Códigos de Status HTTP

| Código | Significado          | Descrição                           |
| ------ | -------------------- | ----------------------------------- |
| 200    | OK                   | Operação realizada com sucesso      |
| 400    | Bad Request          | Erro na requisição ou processamento |
| 422    | Unprocessable Entity | Parâmetros obrigatórios ausentes    |
| 401    | Unauthorized         | Token de autenticação inválido      |

## Tratamento de Erros

### Estrutura de Erro Padrão

```typescript
interface ErrorResponse {
  message: string;
  statusCode: number;
}
```

### Implementação de Tratamento de Erros

```typescript
const handleApiError = (error: any) => {
  if (error.response) {
    // Erro da API
    const { status, data } = error.response;
    switch (status) {
      case 400:
        console.error("Erro na requisição:", data.message);
        break;
      case 401:
        console.error("Token inválido");
        // Redirecionar para login
        break;
      case 422:
        console.error("Parâmetros inválidos:", data.message);
        break;
      default:
        console.error("Erro desconhecido:", data.message);
    }
  } else {
    console.error("Erro de rede:", error.message);
  }
};
```

## Exemplo de Hook React

```typescript
import { useState, useCallback } from "react";

interface UseWhatsappApiProps {
  token: string;
  whatsappToken: string;
}

export const useWhatsappApi = ({
  token,
  whatsappToken,
}: UseWhatsappApiProps) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createSession = useCallback(
    async (sessionData: CreateSessionRequest) => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch("/whatsapp/session/create", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(sessionData),
        });

        if (!response.ok) {
          throw new Error("Erro ao criar sessão");
        }

        return response;
      } catch (err) {
        setError(err.message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [token]
  );

  const getSessions = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/whatsapp/sessions", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ token: whatsappToken }),
      });

      if (!response.ok) {
        throw new Error("Erro ao buscar sessões");
      }

      return response.json();
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [token, whatsappToken]);

  const sendTextMessage = useCallback(
    async (instanceId: string, message: RequestTextMessage) => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `/whatsapp/send_text_message/${instanceId}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(message),
          }
        );

        if (!response.ok) {
          throw new Error("Erro ao enviar mensagem");
        }

        return response.json();
      } catch (err) {
        setError(err.message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [token]
  );

  const getGroups = useCallback(
    async (instanceId: string) => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/whatsapp/chats/${instanceId}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ token: whatsappToken }),
        });

        if (!response.ok) {
          throw new Error("Erro ao buscar grupos");
        }

        return response.json();
      } catch (err) {
        setError(err.message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [token, whatsappToken]
  );

  return {
    loading,
    error,
    createSession,
    getSessions,
    sendTextMessage,
    getGroups,
  };
};
```

## Componente React de Exemplo

```typescript
import React, { useState, useEffect } from "react";
import { useWhatsappApi } from "./hooks/useWhatsappApi";

interface Session {
  id: string;
  name: string;
  description: string;
  status: string;
}

const WhatsappManager: React.FC = () => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [selectedSession, setSelectedSession] = useState<string>("");
  const [newSessionName, setNewSessionName] = useState("");
  const [newSessionDescription, setNewSessionDescription] = useState("");

  const { loading, error, createSession, getSessions, getGroups } =
    useWhatsappApi({
      token: "your-auth-token",
      whatsappToken: "your-whatsapp-token",
    });

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      const data = await getSessions();
      setSessions(data);
    } catch (err) {
      console.error("Erro ao carregar sessões:", err);
    }
  };

  const loadGroups = async (instanceId: string) => {
    try {
      const data = await getGroups(instanceId);
      setGroups(data);
    } catch (err) {
      console.error("Erro ao carregar grupos:", err);
    }
  };

  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await createSession({
        name: newSessionName,
        description: newSessionDescription,
      });

      setNewSessionName("");
      setNewSessionDescription("");
      loadSessions(); // Recarregar lista
    } catch (err) {
      console.error("Erro ao criar sessão:", err);
    }
  };

  const handleSessionSelect = (sessionId: string) => {
    setSelectedSession(sessionId);
    loadGroups(sessionId);
  };

  return (
    <div>
      <h2>Gerenciar Sessões WhatsApp</h2>

      {error && <div className="error">{error}</div>}

      <form onSubmit={handleCreateSession}>
        <input
          type="text"
          placeholder="Nome da sessão"
          value={newSessionName}
          onChange={(e) => setNewSessionName(e.target.value)}
          required
        />
        <input
          type="text"
          placeholder="Descrição"
          value={newSessionDescription}
          onChange={(e) => setNewSessionDescription(e.target.value)}
          required
        />
        <button type="submit" disabled={loading}>
          {loading ? "Criando..." : "Criar Sessão"}
        </button>
      </form>

      <div>
        <h3>Sessões Ativas</h3>
        {sessions.map((session) => (
          <div key={session.id}>
            <strong>{session.name}</strong>
            <p>{session.description}</p>
            <span>Status: {session.status}</span>
            <button onClick={() => handleSessionSelect(session.id)}>
              Ver Grupos
            </button>
          </div>
        ))}
      </div>

      {selectedSession && (
        <div>
          <h3>Grupos da Sessão</h3>
          {groups.map((group) => (
            <div key={group.id}>
              <strong>{group.subject}</strong>
              <p>Participantes: {group.size}</p>
              <p>Descrição: {group.desc}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default WhatsappManager;
```

## Novo Endpoint: Buscar Grupos

### Funcionalidade

O endpoint `GET /whatsapp/chats/:instanceId` permite buscar todos os grupos de uma instância específica do WhatsApp. Este endpoint utiliza a Evolution API para obter informações detalhadas sobre os grupos.

### Características Técnicas

- **Método**: GET
- **Autenticação**: Bearer Token obrigatório
- **Parâmetro**: `instanceId` (ID da instância)
- **Body**: Token do WhatsApp API
- **Resposta**: Array de objetos com informações dos grupos

### Informações Retornadas

Cada grupo retornado contém:

- **id**: Identificador único do grupo
- **subject**: Nome do grupo
- **size**: Número de participantes
- **desc**: Descrição do grupo
- **pictureUrl**: URL da foto do grupo (se disponível)
- **creation**: Timestamp de criação
- **owner**: ID do proprietário
- **restrict**: Se o grupo é restrito
- **announce**: Se o grupo permite anúncios

### Exemplo de Uso

```typescript
// Buscar grupos de uma instância
const groups = await getGroups("instance-123", "whatsapp-token");

// Resultado esperado
[
  {
    id: "120363123456789012@g.us",
    subject: "Grupo de Trabalho",
    size: 15,
    desc: "Grupo para discussões de trabalho",
    pictureUrl: "https://example.com/group-pic.jpg",
    creation: 1640995200000,
    owner: "5511999999999@s.whatsapp.net",
    restrict: false,
    announce: true,
  },
];
```

### Tratamento de Erros

- **422**: Instance ID não fornecido
- **400**: Erro na comunicação com a Evolution API
- **401**: Token de autenticação inválido

## Considerações de Segurança

1. **Autenticação**: Sempre incluir o token Bearer nas requisições
2. **Validação**: Validar todos os dados no frontend antes do envio
3. **Rate Limiting**: Implementar controle de taxa para evitar spam
4. **Sanitização**: Sanitizar dados de entrada para prevenir XSS

## Performance

1. **Cache**: Implementar cache para sessões e dados estáticos
2. **Debounce**: Usar debounce para operações de busca
3. **Lazy Loading**: Carregar dados sob demanda
4. **Pagination**: Implementar paginação para listas grandes

## Monitoramento

1. **Logs**: Implementar logging de erros e operações
2. **Métricas**: Monitorar performance das requisições
3. **Alertas**: Configurar alertas para falhas críticas
4. **Analytics**: Rastrear uso da API

---

**Última atualização**: Dezembro 2024
**Versão da API**: 1.0.0
