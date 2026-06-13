# AMS HelpMe — Roadmap / Próximas etapas

> Planejamento de evolução do produto a partir do MVP base. Cada item indica o
> esforço relativo e os pontos do código/banco que ele toca.

---

## ✅ Etapa 0 — MVP base (concluído)

O que já está pronto e validado:

- Monorepo com `database` / `backend` / `frontend` (npm workspaces).
- **Banco** PostgreSQL com 10 tabelas (Prisma), migration `init` e seed.
- **Autenticação JWT própria**: registro (cria organização + admin), login,
  refresh rotativo (cookie httpOnly), logout, `/me`. Senha com argon2.
- **Multi-tenant** por organização, com isolamento em todas as consultas.
- **Chamados**: criação com numeração sequencial, listagem com filtros,
  detalhe, troca de status com histórico, atribuição, comentários
  (público + nota interna), avaliação (rating) no backend.
- **RBAC**: solicitante x atendente x admin (ex.: nota interna oculta do
  solicitante, atribuição restrita a atendentes).
- **Frontend**: login/registro, dashboard, lista e detalhe de chamados, abertura
  de chamado, aplicações; **i18n (pt-BR / en-US)** e **tema claro/escuro**.
- Script `start-dev.ps1` para subir tudo de uma vez.

---

## 🎯 Etapa 1 — Completar o ciclo do chamado (curto prazo)

Funcionalidades cujas **tabelas já existem**, faltando endpoints e/ou UI.

| Item | Onde mexe | Notas |
|------|-----------|-------|
| **Upload de anexos** | tabela `ticket_attachments` (existe) | Endpoint de upload (multer) + storage local no MVP (`/uploads`); evoluir para S3/Cloudinary. UI no detalhe do chamado. |
| **Notificações in-app** | tabela `notifications` (existe) | Gerar notificação ao atribuir / comentar / mudar status. Endpoint de listagem + marcar como lida. Badge no topo (sino). |
| **Gestão de usuários (UI)** | endpoints `GET/POST /users` (existem) | Tela de admin para listar/criar/desativar usuários e definir papel. |
| **Avaliação na UI** | endpoint `POST /tickets/:id/rate` (existe) | Mostrar estrelas ao encerrar; exibir nota no detalhe. |
| **Perfil do usuário** | campos `language`/`theme` em `users` | Persistir idioma/tema escolhidos no backend (hoje só em localStorage) e editar nome/senha. |
| **Categorias (UI admin)** | endpoints de `categories` (existem) | Tela para criar/remover categorias. |

---

## 🚀 Etapa 2 — Operação e produtividade (médio prazo)

| Item | Descrição |
|------|-----------|
| **SLA** | Prazos por prioridade, contagem de tempo de primeira resposta e resolução (campos `firstResponseAt`/`resolvedAt` já existem), alertas de estouro. |
| **Dashboards e relatórios** | Métricas por período, por atendente, por aplicação; tempo médio de atendimento; gráficos. |
| **Quadro Kanban** | Visualização dos chamados por status, com arrastar-e-soltar. |
| **Filtros salvos / busca avançada** | Combinações de filtros reutilizáveis; busca full-text. |
| **Notificações por e-mail** | Disparo em eventos-chave (Nodemailer + provedor SMTP/Resend). |
| **Editor de comentários** | Suporte a markdown e menções (@atendente). |
| **Paginação e ordenação na UI** | A API já pagina; expor na lista de chamados. |

---

## 🧩 Etapa 3 — Plataforma SaaS (longo prazo)

| Item | Descrição |
|------|-----------|
| **Planos e billing** | Assinaturas por organização (Stripe), limites por plano. |
| **Onboarding** | Fluxo guiado de criação da empresa, convites por e-mail. |
| **Permissões granulares** | RBAC mais fino (ex.: atendente por aplicação/equipe). |
| **Portal público do solicitante** | Base de conhecimento / FAQ e abertura sem login. |
| **Webhooks / API pública** | Integrações externas (chave de API por organização). |
| **Auditoria expandida** | Log de ações além de status (LGPD/compliance). |
| **Super admin** | Painel global para gerenciar organizações (papel `SUPER_ADMIN` já existe). |

---

## 🛡️ Qualidade e infraestrutura (transversal)

Recomendado começar já na Etapa 1, em paralelo.

- **Recuperação de senha** (token por e-mail) e **política de senha forte**.
- **Testes**: unitários (services), integração (rotas com banco de teste),
  e2e no frontend (Playwright).
- **CI/CD**: GitHub Actions (lint + typecheck + testes + build) e deploy automático.
- **Rate limiting** e **helmet** no backend.
- **Logs estruturados** (pino) e **monitoramento de erros** (Sentry).
- **Limpeza de refresh tokens** expirados (job agendado).
- **Variáveis de ambiente** validadas (já feito no backend com Zod) e segredos
  fortes em produção (trocar os `*_SECRET` do `.env.example`).

---

## ☁️ Deploy de teste (sugerido)

Objetivo: colocar no ar para validação com usuários reais.

### Banco + Backend — Railway

1. Criar projeto no Railway e adicionar um **PostgreSQL**.
2. Adicionar um **serviço** apontando para a pasta `backend` (root do monorepo
   com build command que gera o Prisma Client a partir de `database/`).
3. Variáveis: `DATABASE_URL` (do Railway), `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`
   (gerar aleatórios), `CORS_ORIGIN` (URL da Vercel), `COOKIE_SECURE=true`,
   `NODE_ENV=production`.
4. Rodar `prisma migrate deploy` no start (já há o script `migrate:deploy`).

### Frontend — Vercel

1. Importar o repositório, **root** = `frontend`.
2. Build: `npm run build`; output: `dist`.
3. Variável `VITE_API_URL` apontando para a URL pública do backend (`https://.../api`).
4. Ajustar o `CORS_ORIGIN` do backend para o domínio da Vercel.

> Observação sobre cookies: em produção o frontend e o backend ficam em domínios
> diferentes. Para o refresh token funcionar via cookie, configurar `SameSite=None`
> + `Secure=true` no cookie e CORS com `credentials`. Alternativa mais simples:
> servir ambos sob o mesmo domínio (subpath ou subdomínio) ou trocar o refresh
> para fluxo via header. Avaliar na hora do deploy.

---

## Ordem sugerida de execução

1. Anexos + notificações in-app (fecham o ciclo do chamado).
2. Gestão de usuários + perfil + avaliação na UI.
3. Recuperação de senha + testes básicos + CI.
4. Deploy de teste (Railway + Vercel).
5. SLA + dashboards.
6. Billing e demais itens de plataforma.
