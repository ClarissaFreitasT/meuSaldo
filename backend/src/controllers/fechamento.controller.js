import { prisma } from "../config/prisma.js";
import { validarMesAno } from "../services/fechamento.service.js";

export async function listar(req, res, next) {
  try {
    const fechamentos = await prisma.fechamentoMensal.findMany({ where: { usuarioId: req.usuario.id }, orderBy: [{ ano: "desc" }, { mes: "desc" }] });
    res.json({ fechamentos });
  } catch (err) { next(err); }
}

export async function encerrar(req, res, next) {
  try {
    const { mes, ano } = validarMesAno(req.body.mes, req.body.ano);
    const agora = new Date();
    if (ano > agora.getUTCFullYear() || (ano === agora.getUTCFullYear() && mes > agora.getUTCMonth() + 1)) return res.status(400).json({ erro: "Não é possível encerrar um mês futuro." });
    const existente = await prisma.fechamentoMensal.findUnique({ where: { usuarioId_mes_ano: { usuarioId: req.usuario.id, mes, ano } } });
    if (existente) return res.status(409).json({ erro: "Este mês já foi encerrado." });
    const fechamento = await prisma.fechamentoMensal.create({ data: { usuarioId: req.usuario.id, mes, ano } });
    res.status(201).json({ fechamento, mensagem: "Mês encerrado. As movimentações deste período não poderão mais ser alteradas." });
  } catch (err) { next(err); }
}
