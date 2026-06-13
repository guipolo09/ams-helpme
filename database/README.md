# Database — AMS HelpMe

Fonte da verdade do banco de dados (PostgreSQL via Prisma).

- `prisma/schema.prisma` — modelo de dados
- `prisma/migrations/` — histórico de migrations versionado
- `prisma/seed.ts` — dados iniciais (organização demo + usuários de teste)

## Comandos

```bash
npm install
npm run generate        # gera o Prisma Client
npm run migrate         # cria/aplica migrations em dev
npm run seed            # popula dados de teste
npm run studio          # abre o Prisma Studio (UI do banco)
npm run reset           # apaga e recria o banco (cuidado)
```

> O backend consome o mesmo `schema.prisma` apontando para este arquivo.
