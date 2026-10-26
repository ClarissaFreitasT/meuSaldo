import { prisma } from "../config/prisma.js";
import { validarMesAno } from "../services/fechamento.service.js";

export async function resumo(req, res, next) {
  try {
    const agora = new Date();
    const { mes, ano } = validarMesAno(req.query.mes ?? agora.getUTCMonth() + 1, req.query.ano ?? agora.getUTCFullYear());
    const data = { gte: new Date(Date.UTC(ano, mes - 1, 1)), lt: new Date(Date.UTC(ano, mes, 1)) };
    const where = { usuarioId: req.usuario.id, data };
    const [entradas, despesas, contagem, fechamento] = await Promise.all([
      prisma.movimentacao.aggregate({ where: { ...where, tipo: "ENTRADA" }, _sum: { valor: true } }),
      prisma.movimentacao.aggregate({ where: { ...where, tipo: "DESPESA" }, _sum: { valor: true } }),
      prisma.movimentacao.count({ where }),
      prisma.fechamentoMensal.findUnique({ where: { usuarioId_mes_ano: { usuarioId: req.usuario.id, mes, ano } } })
    ]);
    const totalEntradas = Number(entradas._sum.valor || 0);
    const totalDespesas = Number(despesas._sum.valor || 0);
    res.json({ mes, ano, entradas: totalEntradas, despesas: totalDespesas, saldo: Math.round((totalEntradas - totalDespesas) * 100) / 100, quantidadeMovimentacoes: contagem, encerrado: Boolean(fechamento) });
  } catch (err) { next(err); }
}
