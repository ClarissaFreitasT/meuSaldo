# MeuSaldo — controle financeiro pessoal

Projeto full stack para a avaliação de DSW. Permite que cada usuário gerencie entradas e despesas, consulte seu resumo financeiro e encerre meses. Depois do encerramento, as movimentações daquele mês não podem ser criadas, editadas ou excluídas.

## Tecnologias
- Backend: Node.js, Express, arquitetura MVC e serviços de regras de negócio.
- Banco relacional: MySQL/MariaDB.
- ORM: Prisma ORM e `@prisma/client` fixados em `7.10.0`.
- Autenticação: JWT e senhas com bcrypt.
- Frontend: React, Vite e Tailwind CSS `4.3.0`.

> Importante: este é o código inicial do projeto. Antes da entrega, instale as dependências, execute os testes manuais e automatizados, confirme as versões no ambiente da escola e valide a publicação. Você também precisa compreender e conseguir explicar o código na apresentação individual.

## Requisitos
- Node.js 20 ou superior recomendado.
- MySQL ou MariaDB em execução.
- npm.

## 1. Banco de dados
Crie um banco vazio chamado `meusaldo` no MySQL/MariaDB.

## 2. Backend
No terminal:

```bash
cd backend
npm install
```

Copie `.env.example` para `.env` e ajuste as variáveis:

```env
PORT=3000
DATABASE_URL="mysql://USUARIO:SENHA@localhost:3306/meusaldo"
DB_HOST=localhost
DB_PORT=3306
DB_USER=USUARIO
DB_PASSWORD=SENHA
DB_NAME=meusaldo
JWT_SECRET=coloque-uma-chave-longa-e-aleatoria-aqui
JWT_EXPIRES_IN=1d
CLIENT_URL=http://localhost:5173
```

Gere o Prisma Client e aplique a primeira migration:

```bash
npm run prisma:generate
npm run prisma:migrate
npm run dev
```

A API estará em `http://localhost:3000`. Verifique `http://localhost:3000/api/health`.

## 3. Frontend
Em outro terminal:

```bash
cd frontend
npm install
```

Copie `.env.example` para `.env` (o padrão já aponta para `http://localhost:3000/api`) e execute:

```bash
npm run dev
```

Abra o endereço indicado pelo Vite, normalmente `http://localhost:5173`.

## Principais rotas
- `POST /api/auth/register` — criar conta.
- `POST /api/auth/login` — entrar.
- `GET /api/auth/me` — usuário autenticado.
- `GET /api/movimentacoes?mes=10&ano=2026` — listar movimentações do usuário.
- `POST /api/movimentacoes` — criar entrada ou despesa.
- `GET /api/movimentacoes/:id` — consultar uma movimentação própria.
- `PUT /api/movimentacoes/:id` — editar movimentação própria.
- `DELETE /api/movimentacoes/:id` — excluir movimentação própria.
- `GET /api/dashboard?mes=10&ano=2026` — resumo do mês.
- `GET /api/fechamentos` — listar fechamentos do usuário.
- `POST /api/fechamentos` — encerrar mês com `{ "mes": 10, "ano": 2026 }`.

Todas as rotas exceto cadastro, login e health exigem `Authorization: Bearer TOKEN`.

## Regra de negócio
O backend verifica se o usuário encerrou o mês antes de criar, editar ou excluir uma movimentação. A verificação considera o usuário autenticado e o mês/ano da movimentação. Não é suficiente ocultar os botões no frontend.

## Segurança
- Não envie o arquivo `.env` ao GitHub.
- Use uma chave JWT longa e exclusiva fora do ambiente local.
- O frontend guarda o token no `localStorage` para simplificar o projeto didático. Para um produto real, considere uma estratégia de sessão mais robusta.
- O saldo é calculado a partir das movimentações; não é armazenado manualmente.

## Antes de entregar
- Testar registro, login e logout.
- Testar CRUD e persistência no banco.
- Testar usuário A tentando acessar dados do usuário B.
- Testar uma movimentação aceita e uma bloqueada após fechamento mensal.
- Validar variáveis de ambiente e CORS em produção.
- Atualizar este README com os endereços reais de publicação e fontes de quaisquer componentes externos usados.
