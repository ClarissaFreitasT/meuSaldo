import "dotenv/config";
import app from "./app.js";

const port = Number(process.env.PORT || 3000);
const server = app.listen(port, () => console.log(`MeuSaldo API rodando em http://localhost:${port}`));

const shutdown = () => server.close(() => process.exit(0));
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
