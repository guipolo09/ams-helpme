# Deploy na Vercel (frontend + backend serverless + Neon)

Esta versão publica **tudo num único projeto Vercel**, no mesmo domínio:

- **Frontend**: build estático do Vite (`frontend/dist`).
- **Backend**: o app Express roda como **função serverless** em `/api/*`
  (arquivo [`api/[...path].ts`](../api/[...path].ts)).
- **Banco**: PostgreSQL gerenciado no **Neon** (serverless, plano free).

Como frontend e API ficam na mesma origem, o cookie de refresh funciona sem
configuração extra de CORS.

---

## Pré-requisitos

- Conta no [GitHub](https://github.com) (o código precisa estar num repositório).
- Conta no [Neon](https://neon.tech) (Postgres).
- Conta na [Vercel](https://vercel.com).

---

## Passo 1 — Criar o banco no Neon

1. Crie um projeto no Neon (região mais próxima dos seus testes).
2. No painel **Connection Details**, copie **duas** strings de conexão:
   - **Pooled connection** (host com `-pooler`) → usada pela aplicação.
   - **Direct connection** (sem `-pooler`) → usada para rodar as migrations.
3. Garanta que ambas terminem com `?sslmode=require`.

> Por que duas? O pool (PgBouncer) é ideal para o ambiente serverless, mas as
> migrations precisam de uma conexão direta.

---

## Passo 2 — Aplicar migrations e seed no Neon

Rode **localmente**, apontando para a conexão **direta** do Neon. No PowerShell,
na raiz do projeto:

```powershell
# usa a string DIRETA do Neon só para este comando
$env:DATABASE_URL = "postgresql://...neon-DIRECT...?sslmode=require"

npm run db:generate
npm run db:migrate:deploy   # cria as tabelas no Neon
npm run db:seed             # cria org demo + usuários de teste

# limpa a variável para não atrapalhar o dev local
Remove-Item Env:DATABASE_URL
```

> Quer um ambiente de teste sem os dados de exemplo? Pule o `db:seed` e crie a
> primeira conta pela tela de **cadastro** do app (ela cria a organização + admin).

---

## Passo 3 — Subir o código para o GitHub

> O repositório git local **já foi inicializado** e o primeiro commit já existe
> (branch `main`). Você só precisa criar o repositório vazio no GitHub e conectar.

### 3.1 — Criar o repositório no GitHub (pela web)

1. Acesse <https://github.com/new> (logado na sua conta).
2. **Repository name**: `ams-helpme` (ou outro nome).
3. **Visibility**: `Private` (recomendado para o MVP) ou `Public`.
4. **NÃO** marque "Add a README", "Add .gitignore" nem "license" — o repositório
   precisa ficar **vazio**, senão o push dá conflito.
5. Clique em **Create repository**.
6. Na tela seguinte, copie a URL do repositório (ex.:
   `https://github.com/guilhermemartinspolo/ams-helpme.git`).

### 3.2 — Conectar e enviar (na raiz do projeto)

```powershell
git remote add origin https://github.com/<seu-usuario>/ams-helpme.git
git push -u origin main
```

> Na primeira vez, o Git pode pedir login no GitHub — autorize na janela que abrir
> (ou use um Personal Access Token como senha). Próximos envios são só `git push`.

### Alternativa — via GitHub CLI (`gh`)

Se você tem o [GitHub CLI](https://cli.github.com) instalado e autenticado
(`gh auth login`), dá para criar e enviar num comando só:

```powershell
gh repo create ams-helpme --private --source=. --remote=origin --push
```

---

## Passo 4 — Importar na Vercel

1. Em **Add New → Project**, importe o repositório.
2. **Root Directory**: deixe a **raiz** do repositório (não escolha `frontend`).
   O [`vercel.json`](../vercel.json) já define build, output e as rotas.
   > ⚠️ Isto é crítico. Se o Root Directory apontar para uma subpasta, a Vercel
   > ignora o `vercel.json` da raiz e tenta `npm install --prefix=..`, que falha.
   > Confira em **Settings → Build and Deployment → Root Directory** (deve estar
   > vazio / `./`).
3. **Framework Preset**: `Other` (o `vercel.json` cuida do resto).
4. Antes de clicar em **Deploy**, configure as variáveis de ambiente (próximo passo).

### Variáveis de ambiente (Settings → Environment Variables)

| Variável | Valor | Obrigatória |
|----------|-------|:----------:|
| `DATABASE_URL` | string **pooled** do Neon (`...-pooler...?sslmode=require`) | ✅ |
| `JWT_ACCESS_SECRET` | valor aleatório longo | ✅ |
| `JWT_REFRESH_SECRET` | outro valor aleatório longo | ✅ |
| `COOKIE_SECURE` | `true` | ✅ |
| `JWT_ACCESS_EXPIRES_IN` | `15m` | opcional |
| `JWT_REFRESH_EXPIRES_IN_DAYS` | `7` | opcional |
| `CORS_ORIGIN` | a URL do projeto (ex.: `https://ams-helpme.vercel.app`) | opcional |

Gere segredos fortes assim (rode duas vezes):

```powershell
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

5. Clique em **Deploy**.

---

## Passo 5 — Validar

- Acesse a URL gerada (`https://<seu-projeto>.vercel.app`).
- Faça login com um usuário do seed (`admin@demo.com` / `senha123`) **ou**
  cadastre uma nova empresa.
- Teste a API direto: `https://<seu-projeto>.vercel.app/api/health` deve
  responder `{"status":"ok"}`.

---

## Atualizações futuras

- **Código**: cada `git push` na `main` dispara um novo deploy automático.
- **Mudou o schema do banco?** Rode o Passo 2 de novo (com a string direta do
  Neon) para aplicar a nova migration antes/depois do deploy.

---

## Solução de problemas

| Sintoma | Causa provável / solução |
|--------|--------------------------|
| `500` em `/api/...` logo após o deploy | Variável de ambiente faltando (veja os **Logs** da função na Vercel). Confirme `DATABASE_URL` e os `JWT_*`. |
| `Can't reach database server` | `DATABASE_URL` errada ou banco do Neon suspenso. Use a string **pooled** e confira o `?sslmode=require`. |
| Login funciona mas "cai" ao recarregar | `COOKIE_SECURE` deve ser `true` em produção (HTTPS). |
| Erro de engine do Prisma na função | O `binaryTargets` já inclui `rhel-openssl-3.0.x`; garanta que o build rodou o `postinstall` (gera o client). Refaça o deploy. |
| Página em branco em rotas internas | O `vercel.json` já faz o fallback de SPA para `index.html`; confirme que o deploy usou o `vercel.json` da raiz. |
| `npm install --prefix=..` falhando com `ENOENT /vercel/package.json` | O **Root Directory** está numa subpasta. Ajuste para a raiz (`./`) em Settings → Build and Deployment e refaça o deploy. |

---

## Limitações desta topologia (para evoluir depois)

- **Cold start**: a primeira chamada após inatividade é mais lenta (função "acorda").
- **Anexos**: upload em disco não persiste em serverless — quando implementar a
  Etapa 1, usar um storage externo (S3, Cloudinary, Vercel Blob).
- Para carga maior/produção real, considerar mover o backend para um serviço
  sempre-ligado (Railway/Render) — ver [ROADMAP.md](ROADMAP.md).
