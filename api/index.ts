// Ponto de entrada serverless da Vercel.
// O vercel.json faz rewrite de /api/* para esta função; o app Express já monta
// as rotas em "/api", então a URL original chega correta aqui.
import { app } from "../backend/src/app";

export default app;
