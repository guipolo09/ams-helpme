# AMS HelpMe

SaaS de Gerenciamento de Aplicações por meio de chamados (helpdesk / ITSM) — MVP.

Monorepo (**npm workspaces**) com três pastas independentes para versionamento:

```
ams-helpme/
├── database/   # Schema Prisma, migrations e seed (fonte da verdade do banco)
├── backend/    # API REST (Node.js + Express + Prisma + JWT)
├── frontend/   # SPA (React + Vite + Tailwind, i18n e tema claro/escuro)
├── api/        # Entrada serverless da Vercel (reusa o app do backend)
├── docs/       # Documentação de arquitetura, roadmap e deploy
├── vercel.json         # Config de deploy (Vercel)
├── start-dev.ps1       # Script que sobe tudo de uma vez (Windows)
└── docker-compose.yml  # PostgreSQL local
```

> **Importante:** o projeto usa **npm workspaces**, então o `npm install` é feito **na raiz**
> (uma única vez), e não dentro de cada pasta. Os scripts são disparados pela raiz com
> `npm run <script>` (ex.: `npm run dev:backend`).

## Pré-requisitos

- Node.js 20+
- Docker (para o PostgreSQL local) — ou um Postgres próprio

---

## Início rápido (Windows) — recomendado

Na **primeira vez** (sobe o banco, aplica migrations, popula dados e abre as janelas):

```powershell
.\start-dev.ps1 -Seed
```

Nas próximas vezes (apenas sobe o banco e abre backend + frontend):

```powershell
.\start-dev.ps1
```

O script abre duas janelas (BACKEND e FRONTEND) com hot-reload. Acesse
**http://localhost:5173** no navegador.

> Se o PowerShell bloquear a execução do script, libere para a sessão atual com:
> `Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass`

---

## Início manual (passo a passo)

### 1. Instalar dependências (na raiz)

```bash
npm install
```

### 2. Subir o banco

```bash
docker compose up -d
```

Cria um PostgreSQL em `localhost:5432` (user `ams`, senha `ams_dev_password`, db `ams_helpme`).

### 3. Preparar o banco (gerar client, migrations e seed)

```bash
# copie os .env de exemplo (uma vez)
copy database\.env.example database\.env
copy backend\.env.example backend\.env
copy frontend\.env.example frontend\.env

npm run db:generate     # gera o Prisma Client
npm run db:migrate      # aplica as migrations (cria as tabelas)
npm run db:seed         # cria organização demo + usuários de teste
```

### 4. Rodar backend e frontend (em terminais separados)

```bash
npm run dev:backend     # API em http://localhost:3333
npm run dev:frontend    # App em http://localhost:5173
```

---

## Scripts disponíveis (na raiz)

| Script                  | O que faz                                         |
|-------------------------|---------------------------------------------------|
| `npm run dev:backend`   | Sobe a API (tsx watch) em :3333                   |
| `npm run dev:frontend`  | Sobe o app (Vite) em :5173                        |
| `npm run db:generate`   | Gera o Prisma Client                              |
| `npm run db:migrate`    | Aplica migrations (modo dev)                      |
| `npm run db:seed`       | Popula dados de teste                             |
| `npm run db:studio`     | Abre o Prisma Studio (UI do banco)               |
| `npm run typecheck`     | Checagem de tipos de backend + frontend           |

## Usuários de teste (criados pelo seed)

| Papel       | Email                  | Senha     |
|-------------|------------------------|-----------|
| Admin       | admin@demo.com         | senha123  |
| Atendente   | agente@demo.com        | senha123  |
| Solicitante | solicitante@demo.com   | senha123  |

---

## Solução de problemas

**`Can't reach database server at <ip>:<porta>`** — o backend está usando um
`DATABASE_URL` diferente do `.env`. Isso acontece quando há uma variável de ambiente
`DATABASE_URL` definida na sessão do terminal (o `dotenv` não sobrescreve variáveis já
existentes). Verifique e limpe:

```powershell
$env:DATABASE_URL                              # mostra o valor atrasado
Remove-Item Env:DATABASE_URL -ErrorAction SilentlyContinue
```

Ou simplesmente abra um terminal novo. O `start-dev.ps1` já faz essa limpeza
automaticamente na janela do backend.

**Porta 3333 ou 5173 ocupada** — encerre o processo preso ou rode o `start-dev.ps1`,
que libera as portas antes de iniciar.

---

## Documentação

- [docs/MVP-ESTRUTURA.md](docs/MVP-ESTRUTURA.md) — arquitetura completa do MVP
- [docs/ROADMAP.md](docs/ROADMAP.md) — próximas etapas do projeto

## Deploy (Vercel + Neon)

A primeira versão é publicada num **único projeto Vercel** (frontend estático +
backend serverless em `/api/*`) com PostgreSQL no **Neon**.

Passo a passo completo em **[docs/DEPLOY-VERCEL.md](docs/DEPLOY-VERCEL.md)**.
