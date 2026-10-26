import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth.routes.js";
import movimentacaoRoutes from "./routes/movimentacao.routes.js";
import dashboardRoutes from "./routes/dashboard.routes.js";
import fechamentoRoutes from "./routes/fechamento.routes.js";
import { errorHandler, notFound } from "./middlewares/error.middleware.js";

const app = express();
app.use(cors({ origin: process.env.CLIENT_URL?.split(",") || "http://localhost:5173" }));
app.use(express.json({ limit: "1mb" }));
app.get("/api/health", (_req, res) => res.json({ status: "ok", app: "MeuSaldo API" }));
app.use("/api/auth", authRoutes);
app.use("/api/movimentacoes", movimentacaoRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/fechamentos", fechamentoRoutes);
app.use(notFound);
app.use(errorHandler);

export default app;
