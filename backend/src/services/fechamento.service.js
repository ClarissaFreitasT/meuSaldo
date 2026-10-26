import { prisma } from "../config/prisma.js";

export async function verificarMesAberto(usuarioId, data) {
  const mes = data.getUTCMonth() + 1;
  const ano = data.getUTCFullYear();
  const fechamento = await prisma.fechamentoMensal.findUnique({
    where: { usuarioId_mes_ano: { usuarioId, mes, ano } }
  });
  if (fechamento) {
    const erro = new Error("Este mês já foi encerrado. Não é possível alterar suas movimentações.");
    erro.status = 409;
    throw erro;
  }
}

export function validarMesAno(mes, ano) {
  const m = Number(mes); const a = Number(ano);
  if (!Number.isInteger(m) || m < 1 || m > 12 || !Number.isInteger(a) || a < 2000 || a > 2200) {
    const erro = new Error("Informe um mês (1 a 12) e ano válidos.");
    erro.status = 400;
    throw erro;
  }
  return { mes: m, ano: a };
}
