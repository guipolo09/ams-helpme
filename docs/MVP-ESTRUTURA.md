# AMS HelpMe — Estrutura do MVP

> Documento de arquitetura da primeira versão (MVP) do SaaS de Gerenciamento de
> Aplicações por meio de chamados (helpdesk / ITSM).
>
> **Status:** rascunho para validação. Itens marcados com ⚠️ precisam da sua confirmação.

---

## 1. Visão geral

**AMS HelpMe** é um SaaS onde empresas-cliente gerenciam suas aplicações através de
chamados (tickets). Existem dois grandes perfis de uso:

- **Usuário do serviço (solicitante / requester):** quem **abre** o chamado.
- **Usuário da plataforma (atendente / agente / admin):** quem **atende** o chamado.

### Decisões técnicas (validadas)

| Camada       | Tecnologia                                                        |
|--------------|-------------------------------------------------------------------|
| Backend      | Node.js + TypeScript, **Express** + **Prisma ORM**, **Zod**       |
| Frontend     | **React + Vite** + TypeScript, **TailwindCSS** + **shadcn/ui**    |
| Banco        | **PostgreSQL**                                                     |
| Autenticação | **JWT próprio** (access + refresh), senha com **argon2**           |
| i18n         | **react-i18next** (en-US e pt-BR)                                  |
| Tema         | Claro / Escuro (Tailwind `dark` + persistência local)             |

> Alternativa considerada: NestJS no backend. Para um MVP de 1 dev, Express + Prisma
> é mais leve e rápido de evoluir, mantendo organização modular.

### ⚠️ Suposição de arquitetura: Multi-tenant

Como é um SaaS vendido para várias empresas, o modelo assume **multi-tenant por
organização**: cada empresa-cliente é uma `organization`, e todo dado (usuários,
aplicações, chamados) pertence a uma organização. Isso isola os dados de cada cliente.

Se a sua ideia for **single-tenant** (uma instalação por cliente) ou um helpdesk onde
**o seu time** atende todos os clientes, me avise que ajusto o modelo.

---

## 2. Perfis de usuário (papéis)

Modelo: **uma única tabela `users`** com um campo `role`. É mais simples e flexível que
tabelas separadas, e cobre os dois perfis pedidos.

| Papel (`role`)   | Quem é                         | Pode                                                                 |
|------------------|--------------------------------|---------------------------------------------------------------------|
| `REQUESTER`      | Usuário do serviço (cliente)   | Abrir chamados, acompanhar, comentar, anexar, avaliar               |
| `AGENT`          | Usuário da plataforma          | Atender, comentar interno/externo, mudar status, atribuir, resolver |
| `ADMIN`          | Gestor da organização          | Tudo do AGENT + gerenciar usuários, aplicações, categorias          |
| `SUPER_ADMIN`    | Você (dono do SaaS)            | Gerenciar organizações, visão global (fase posterior)               |

> **Usuário do serviço** = `REQUESTER`.
> **Usuário da plataforma** = `AGENT` / `ADMIN`.

### Campos de usuário (resumo)

Comuns a todos: `id`, `organizationId`, `name`, `email`, `passwordHash`, `role`,
`avatarUrl`, `phone`, `language` (en-US/pt-BR), `theme` (light/dark/system),
`isActive`, `lastLoginAt`, `createdAt`, `updatedAt`.

Específicos do solicitante: `department`, `jobTitle`.
Específicos do atendente: `isAvailable` (recebe atribuição?), `specialties` (áreas).

> Em vez de duplicar tabelas, os campos específicos convivem na mesma tabela e são
> usados conforme o `role`. No MVP isso é suficiente e simples de manter.

---

## 3. Fluxo do chamado (status)

⚠️ **Você já desenhou um fluxo** — abaixo está uma proposta padrão de mercado para
você comparar e ajustar. O status fica em `tickets.status`.

```
ABERTO ──▶ EM_ATENDIMENTO ──▶ AGUARDANDO_SOLICITANTE ──▶ RESOLVIDO ──▶ ENCERRADO
   │              │                      │                    │
   └─ CANCELADO   └──────────────────────┴── (pode voltar) ───┘
                                              REABERTO ◀── (solicitante reabre)
```

| Status                   | Significado                                               |
|--------------------------|----------------------------------------------------------|
| `ABERTO`                 | Criado pelo solicitante, sem atendente                   |
| `EM_ATENDIMENTO`         | Atendente assumiu / está trabalhando                     |
| `AGUARDANDO_SOLICITANTE` | Esperando resposta/info do solicitante                   |
| `RESOLVIDO`              | Solução aplicada, aguardando confirmação                 |
| `ENCERRADO`              | Finalizado (confirmado ou por inatividade)               |
| `CANCELADO`              | Cancelado antes da resolução                             |
| `REABERTO`               | Solicitante reabriu após resolução                       |

Cada transição é registrada em `ticket_status_history` (auditoria).

**Prioridades:** `BAIXA`, `MEDIA`, `ALTA`, `URGENTE`.

---

## 4. Estrutura do banco de dados (PostgreSQL)

Esquema completo do MVP. Abaixo em formato Prisma (fonte da verdade) — gera o SQL e as
migrations automaticamente.

```prisma
// ===== Enums =====
enum Role            { REQUESTER AGENT ADMIN SUPER_ADMIN }
enum TicketStatus    { ABERTO EM_ATENDIMENTO AGUARDANDO_SOLICITANTE RESOLVIDO ENCERRADO CANCELADO REABERTO }
enum TicketPriority  { BAIXA MEDIA ALTA URGENTE }
enum Language        { EN_US PT_BR }
enum Theme           { LIGHT DARK SYSTEM }

// ===== Organização (tenant) =====
model Organization {
  id           String         @id @default(uuid())
  name         String
  slug         String         @unique          // usado em subdomínio/URL
  logoUrl      String?
  isActive     Boolean        @default(true)
  createdAt    DateTime       @default(now())
  updatedAt    DateTime       @updatedAt

  users        User[]
  applications Application[]
  tickets      Ticket[]
  categories   Category[]
}

// ===== Usuário (solicitante e atendente) =====
model User {
  id             String     @id @default(uuid())
  organizationId String
  organization   Organization @relation(fields: [organizationId], references: [id])

  name           String
  email          String
  passwordHash   String
  role           Role       @default(REQUESTER)

  avatarUrl      String?
  phone          String?
  department     String?    // solicitante
  jobTitle       String?
  specialties    String[]   @default([])  // atendente
  isAvailable    Boolean    @default(true) // atendente

  language       Language   @default(PT_BR)
  theme          Theme      @default(SYSTEM)
  isActive       Boolean    @default(true)
  lastLoginAt    DateTime?
  createdAt      DateTime   @default(now())
  updatedAt      DateTime   @updatedAt

  ticketsCreated   Ticket[]            @relation("Requester")
  ticketsAssigned  Ticket[]            @relation("Assignee")
  comments         TicketComment[]
  attachments      TicketAttachment[]
  statusChanges    TicketStatusHistory[]
  refreshTokens    RefreshToken[]
  notifications    Notification[]

  @@unique([organizationId, email])  // email único por organização
  @@index([organizationId, role])
}

// ===== Token de refresh (JWT) =====
model RefreshToken {
  id         String   @id @default(uuid())
  userId     String
  user       User     @relation(fields: [userId], references: [id])
  tokenHash  String                       // armazenamos o hash, não o token
  expiresAt  DateTime
  revokedAt  DateTime?
  userAgent  String?
  ipAddress  String?
  createdAt  DateTime @default(now())

  @@index([userId])
}

// ===== Aplicação gerenciada =====
model Application {
  id             String   @id @default(uuid())
  organizationId String
  organization   Organization @relation(fields: [organizationId], references: [id])

  name           String
  description    String?
  ownerName      String?   // responsável técnico
  isActive       Boolean   @default(true)
  createdAt      DateTime  @default(now())
  updatedAt      DateTime  @updatedAt

  tickets        Ticket[]

  @@index([organizationId])
}

// ===== Categoria de chamado =====
model Category {
  id             String   @id @default(uuid())
  organizationId String
  organization   Organization @relation(fields: [organizationId], references: [id])
  name           String
  color          String?   // hex p/ UI
  createdAt      DateTime @default(now())

  tickets        Ticket[]

  @@unique([organizationId, name])
}

// ===== Chamado =====
model Ticket {
  id             String         @id @default(uuid())
  organizationId String
  organization   Organization   @relation(fields: [organizationId], references: [id])

  number         Int            // número sequencial por organização (#1, #2...)
  title          String
  description    String
  status         TicketStatus   @default(ABERTO)
  priority       TicketPriority @default(MEDIA)

  applicationId  String?
  application    Application?   @relation(fields: [applicationId], references: [id])
  categoryId     String?
  category       Category?      @relation(fields: [categoryId], references: [id])

  requesterId    String
  requester      User           @relation("Requester", fields: [requesterId], references: [id])
  assigneeId     String?
  assignee       User?          @relation("Assignee", fields: [assigneeId], references: [id])

  rating         Int?           // avaliação 1-5 ao encerrar
  ratingComment  String?

  openedAt       DateTime       @default(now())
  firstResponseAt DateTime?     // base para SLA futuro
  resolvedAt     DateTime?
  closedAt       DateTime?
  createdAt      DateTime       @default(now())
  updatedAt      DateTime       @updatedAt

  comments       TicketComment[]
  attachments    TicketAttachment[]
  statusHistory  TicketStatusHistory[]

  @@unique([organizationId, number])
  @@index([organizationId, status])
  @@index([assigneeId])
  @@index([requesterId])
}

// ===== Comentário / mensagem =====
model TicketComment {
  id         String   @id @default(uuid())
  ticketId   String
  ticket     Ticket   @relation(fields: [ticketId], references: [id])
  authorId   String
  author     User     @relation(fields: [authorId], references: [id])
  body       String
  isInternal Boolean  @default(false)  // nota interna (só atendentes veem)
  createdAt  DateTime @default(now())

  @@index([ticketId])
}

// ===== Anexo =====
model TicketAttachment {
  id            String   @id @default(uuid())
  ticketId      String
  ticket        Ticket   @relation(fields: [ticketId], references: [id])
  uploadedById  String
  uploadedBy    User     @relation(fields: [uploadedById], references: [id])
  fileName      String
  fileUrl       String
  mimeType      String
  sizeBytes     Int
  createdAt     DateTime @default(now())

  @@index([ticketId])
}

// ===== Histórico de status (auditoria) =====
model TicketStatusHistory {
  id          String        @id @default(uuid())
  ticketId    String
  ticket      Ticket        @relation(fields: [ticketId], references: [id])
  changedById String
  changedBy   User          @relation(fields: [changedById], references: [id])
  fromStatus  TicketStatus?
  toStatus    TicketStatus
  note        String?
  createdAt   DateTime      @default(now())

  @@index([ticketId])
}

// ===== Notificação (in-app) =====
model Notification {
  id        String   @id @default(uuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  type      String   // ticket_assigned, ticket_commented, status_changed...
  title     String
  body      String?
  ticketId  String?
  isRead    Boolean  @default(false)
  createdAt DateTime @default(now())

  @@index([userId, isRead])
}
```

### Resumo das tabelas

| Tabela                  | Função                                              |
|-------------------------|-----------------------------------------------------|
| `organizations`         | Tenant (empresa-cliente)                            |
| `users`                 | Solicitantes e atendentes (campo `role`)            |
| `refresh_tokens`        | Sessões/refresh do JWT                              |
| `applications`          | Aplicações gerenciadas                              |
| `categories`            | Categorias de chamado                              |
| `tickets`               | Chamados                                            |
| `ticket_comments`       | Conversa (público + nota interna)                   |
| `ticket_attachments`    | Arquivos anexados                                   |
| `ticket_status_history` | Auditoria de mudança de status                      |
| `notifications`         | Notificações in-app                                 |

---

## 5. Estrutura de pastas (versionamento separado)

Monorepo com três pastas independentes (`backend`, `frontend`, `database`), como pedido.

```
ams-helpme/
├── README.md
├── docker-compose.yml            # Postgres local p/ desenvolvimento
├── .gitignore
│
├── docs/
│   └── MVP-ESTRUTURA.md
│
├── database/                     # === BANCO ===
│   ├── prisma/
│   │   ├── schema.prisma         # fonte da verdade do schema
│   │   ├── migrations/           # migrations versionadas
│   │   └── seed.ts               # dados iniciais (org demo, admin, etc.)
│   └── README.md
│
├── backend/                      # === BACKEND (API) ===
│   ├── package.json
│   ├── tsconfig.json
│   ├── .env.example
│   └── src/
│       ├── server.ts             # bootstrap Express
│       ├── app.ts                # middlewares globais, rotas
│       ├── config/               # env, prisma client, constantes
│       ├── middlewares/          # auth, errorHandler, validate, tenant
│       ├── lib/                  # jwt, hash, mailer, logger
│       └── modules/
│           ├── auth/             # login, refresh, logout, me
│           ├── users/
│           ├── organizations/
│           ├── applications/
│           ├── categories/
│           ├── tickets/          # CRUD + transições de status + comentários
│           └── notifications/
│           # cada módulo: *.routes.ts, *.controller.ts, *.service.ts, *.schema.ts
│
└── frontend/                     # === FRONTEND (SPA) ===
    ├── package.json
    ├── vite.config.ts
    ├── tailwind.config.ts
    ├── .env.example
    └── src/
        ├── main.tsx
        ├── App.tsx
        ├── routes/               # React Router (públicas + protegidas)
        ├── lib/                  # api client (axios), queryClient
        ├── store/                # auth store (Zustand)
        ├── i18n/                 # config + locales/en.json, pt-BR.json
        ├── theme/                # ThemeProvider (light/dark)
        ├── components/
        │   ├── ui/               # shadcn/ui (button, input, dialog...)
        │   └── layout/           # Sidebar, Topbar, LanguageSwitcher, ThemeToggle
        ├── features/
        │   ├── auth/             # Login, Register
        │   ├── dashboard/
        │   ├── tickets/          # lista, detalhe, novo chamado, kanban
        │   ├── applications/
        │   └── users/
        └── hooks/
```

> **Nota:** o `schema.prisma` vive em `database/` (fonte da verdade), e o `backend`
> consome o Prisma Client apontando para ele. Assim banco e API ficam versionados
> separadamente, mas integrados.

---

## 6. Autenticação (JWT próprio)

- **Senha:** hash com **argon2** (mais seguro que bcrypt).
- **Access token:** JWT curto (~15 min), enviado no header `Authorization: Bearer`.
- **Refresh token:** longo (~7 dias), guardado como **hash** em `refresh_tokens`,
  enviado em **cookie httpOnly** (mais seguro contra XSS).
- **Rotação de refresh:** a cada refresh, o token antigo é revogado e um novo emitido.
- **Endpoints:**
  - `POST /auth/register` — cria organização + usuário ADMIN (onboarding)
  - `POST /auth/login`
  - `POST /auth/refresh`
  - `POST /auth/logout`
  - `GET  /auth/me`
- **Autorização:** middleware verifica `role` e `organizationId` (isolamento tenant).

---

## 7. Internacionalização e Tema

- **Idiomas:** `en-US` e `pt-BR` via `react-i18next`. Strings em
  `src/i18n/locales/*.json`. Seletor no topo + persistido em `localStorage` e no
  perfil do usuário (`users.language`).
- **Tema:** claro / escuro / sistema, via Tailwind (`class="dark"`). Toggle no topo,
  persistido em `localStorage` + `users.theme`. Respeita `prefers-color-scheme`.
- **Design:** shadcn/ui + Tailwind = componentes acessíveis, consistentes e bonitos
  com pouco esforço. Tokens de cor por variáveis CSS (fácil trocar paleta da marca).

---

## 8. Recomendação de deploy (testes)

Opção mais simples e barata para colocar no ar rápido:

| Camada    | Serviço recomendado          | Por quê                                          |
|-----------|------------------------------|--------------------------------------------------|
| Banco     | **Neon** ou **Railway** (Postgres) | Postgres gerenciado, plano free generoso    |
| Backend   | **Railway** ou **Render**    | Deploy via Git, fácil, free/baixo custo          |
| Frontend  | **Vercel**                   | Ideal para Vite/React, deploy automático, free   |

**Sugestão:** banco + backend no **Railway** (ficam juntos, menos config) e frontend
na **Vercel**. Tudo com tier gratuito suficiente para os testes do MVP.

---

## 9. Próximos passos

1. ✅ Validar este documento (especialmente: multi-tenant e fluxo de status).
2. ✅ Gerar o scaffold das 3 pastas (`backend`, `frontend`, `database`) com
   `docker-compose` do Postgres e o schema Prisma aplicável.
3. ✅ Implementar auth (register/login/refresh) ponta a ponta.
4. ✅ CRUD de chamados + tela de lista/detalhe + troca de status.
5. ✅ i18n + tema + layout base.
6. ⬜ Deploy de teste.

> O MVP base está concluído e validado. O planejamento das próximas fases
> (anexos, notificações, SLA, dashboards, billing, deploy, qualidade/CI) está em
> [ROADMAP.md](ROADMAP.md).
```
