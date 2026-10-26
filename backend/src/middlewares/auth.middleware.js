import jwt from "jsonwebtoken";

export function autenticar(req, res, next) {
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return res.status(401).json({ erro: "Faça login para continuar." });
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.usuario = { id: payload.sub };
    next();
  } catch {
    return res.status(401).json({ erro: "Sessão inválida ou expirada. Entre novamente." });
  }
}
