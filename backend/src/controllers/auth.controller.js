import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../config/prisma.js";

function tokenPara(usuario) {
  return jwt.sign({ sub: usuario.id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || "1d" });
}

export async function registrar(req, res, next) {
  try {
    const nome = String(req.body.nome || "").trim();
    const email = String(req.body.email || "").trim().toLowerCase();
    const senha = String(req.body.senha || "");
    if (nome.length < 2 || nome.length > 80) return res.status(400).json({ erro: "O nome deve ter entre 2 e 80 caracteres." });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ erro: "Informe um e-mail válido." });
    if (senha.length < 8) return res.status(400).json({ erro: "A senha deve ter pelo menos 8 caracteres." });
    const existente = await prisma.usuario.findUnique({ where: { email } });
    if (existente) return res.status(409).json({ erro: "Já existe uma conta com esse e-mail." });
    const senhaHash = await bcrypt.hash(senha, 12);
    const usuario = await prisma.usuario.create({ data: { nome, email, senhaHash }, select: { id: true, nome: true, email: true } });
    return res.status(201).json({ usuario, token: tokenPara(usuario) });
  } catch (err) { next(err); }
}

export async function login(req, res, next) {
  try {
    const email = String(req.body.email || "").trim().toLowerCase();
    const senha = String(req.body.senha || "");
    const usuario = await prisma.usuario.findUnique({ where: { email } });
    if (!usuario || !(await bcrypt.compare(senha, usuario.senhaHash))) return res.status(401).json({ erro: "E-mail ou senha incorretos." });
    const seguro = { id: usuario.id, nome: usuario.nome, email: usuario.email };
    return res.json({ usuario: seguro, token: tokenPara(usuario) });
  } catch (err) { next(err); }
}

export async function eu(req, res, next) {
  try {
    const usuario = await prisma.usuario.findUnique({ where: { id: req.usuario.id }, select: { id: true, nome: true, email: true, criadoEm: true } });
    if (!usuario) return res.status(404).json({ erro: "Usuário não encontrado." });
    res.json({ usuario });
  } catch (err) { next(err); }
}
