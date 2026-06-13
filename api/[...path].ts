// Ponto de entrada serverless da Vercel.
// Captura todas as rotas /api/* e delega para o app Express do backend.
// O app já monta as rotas em "/api", então a URL original chega correta aqui.
import { app } from "../backend/src/app";

export default app;
