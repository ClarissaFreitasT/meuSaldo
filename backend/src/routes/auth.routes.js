import { Router } from "express";
import { registrar, login, eu } from "../controllers/auth.controller.js";
import { autenticar } from "../middlewares/auth.middleware.js";
const router = Router();
router.post("/register", registrar);
router.post("/login", login);
router.get("/me", autenticar, eu);
export default router;
