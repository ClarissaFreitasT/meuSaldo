export function notFound(_req, res) {
  res.status(404).json({ erro: "Rota não encontrada." });
}

export function errorHandler(err, _req, res, _next) {
  console.error(err);
  if (err?.code === "P2002") return res.status(409).json({ erro: "Este registro já existe." });
  if (err?.code === "P2025") return res.status(404).json({ erro: "Registro não encontrado." });
  return res.status(err.status || 500).json({ erro: err.message || "Erro interno do servidor." });
}
