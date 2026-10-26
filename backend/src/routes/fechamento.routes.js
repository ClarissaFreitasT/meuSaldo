import { Router } from "express";
import { listar, encerrar } from "../controllers/fechamento.controller.js";
import { autenticar } from "../middlewares/auth.middleware.js";
const router = Router();
router.use(autenticar);
router.get("/", listar);
router.post("/", encerrar);
export default router;
