import { prisma } from "../config/prisma.js";
import { parseData, parseValor } from "../utils/validacao.js";
import { verificarMesAberto } from "../services/fechamento.service.js";

const tipos = ["ENTRADA", "DESPESA"];
const categorias = ["Salário", "Mesada", "Presente", "Vendas", "Alimentação", "Transporte", "Moradia", "Estudos", "Saúde", "Lazer", "Contas", "Outros"];

function validarBody(body) {
  const descricao = String(body.descricao || "").trim();
  const tipo = String(body.tipo || "").toUpperCase();
  const categoria = String(body.categoria || "").trim();
  const valor = parseValor(body.valor);
  const data = parseData(body.data);
  if (descricao.length < 2 || descricao.length > 120) throw Object.assign(new Error("A descrição deve ter entre 2 e 120 caracteres."), { status: 400 });
  if (!tipos.includes(tipo)) throw Object.assign(new Error("Tipo deve ser ENTRADA ou DESPESA."), { status: 400 });
  if (!categoria || categoria.length > 50) throw Object.assign(new Error("Informe uma categoria válida."), { status: 400 });
  if (valor === null) throw Object.assign(new Error("O valor deve ser maior que zero."), { status: 400 });
  if (!data) throw Object.assign(new Error("Informe uma data válida no formato AAAA-MM-DD."), { status: 400 });
  return { descricao, tipo, categoria, valor, data };
}

export async function listar(req, res, next) {
  try {
    const where = { usuarioId: req.usuario.id };
    const mes = req.query.mes ? Number(req.query.mes) : null;
    const ano = req.query.ano ? Number(req.query.ano) : null;
    if (mes !== null || ano !== null) {
      if (!Number.isInteger(mes) || mes < 1 || mes > 12 || !Number.isInteger(ano) || ano < 2000 || ano > 2200) return res.status(400).json({ erro: "Para filtrar, informe mês (1–12) e ano válidos." });
      where.data = { gte: new Date(Date.UTC(ano, mes - 1, 1)), lt: new Date(Date.UTC(ano, mes, 1)) };
    }
    if (req.query.tipo && tipos.includes(String(req.query.tipo).toUpperCase())) where.tipo = String(req.query.tipo).toUpperCase();
    const movimentacoes = await prisma.movimentacao.findMany({ where, orderBy: [{ data: "desc" }, { criadoEm: "desc" }] });
    res.json({ movimentacoes });
  } catch (err) { next(err); }
}

export async function consultar(req, res, next) {
  try {
    const item = await prisma.movimentacao.findFirst({ where: { id: req.params.id, usuarioId: req.usuario.id } });
    if (!item) return res.status(404).json({ erro: "Movimentação não encontrada." });
    res.json({ movimentacao: item });
  } catch (err) { next(err); }
}

export async function criar(req, res, next) {
  try {
    const data = validarBody(req.body);
    await verificarMesAberto(req.usuario.id, data.data);
    const movimentacao = await prisma.movimentacao.create({ data: { ...data, usuarioId: req.usuario.id } });
    res.status(201).json({ movimentacao });
  } catch (err) { next(err); }
}

export async function atualizar(req, res, next) {
  try {
    const existente = await prisma.movimentacao.findFirst({ where: { id: req.params.id, usuarioId: req.usuario.id } });
    if (!existente) return res.status(404).json({ erro: "Movimentação não encontrada." });
    await verificarMesAberto(req.usuario.id, existente.data);
    const data = validarBody(req.body);
    await verificarMesAberto(req.usuario.id, data.data);
    const movimentacao = await prisma.movimentacao.update({ where: { id: existente.id }, data });
    res.json({ movimentacao });
  } catch (err) { next(err); }
}

export async function excluir(req, res, next) {
  try {
    const existente = await prisma.movimentacao.findFirst({ where: { id: req.params.id, usuarioId: req.usuario.id } });
    if (!existente) return res.status(404).json({ erro: "Movimentação não encontrada." });
    await verificarMesAberto(req.usuario.id, existente.data);
    await prisma.movimentacao.delete({ where: { id: existente.id } });
    res.status(204).send();
  } catch (err) { next(err); }
}
