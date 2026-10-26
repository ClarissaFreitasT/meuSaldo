import { Router } from "express";
import { resumo } from "../controllers/dashboard.controller.js";
import { autenticar } from "../middlewares/auth.middleware.js";
const router = Router();
router.get("/", autenticar, resumo);
export default router;
