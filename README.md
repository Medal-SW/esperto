# Esperto

Plataforma de ranking diário para um grupo de amigos que joga 3 jogos de palavras: **Conexo**, **Letroso** e **Expresso**.

Cada jogador registra quantas tentativas precisou para resolver cada jogo. O sistema determina vencedores por jogo, campeão do dia e mantém leaderboards com estatísticas.

## Stack

- **Backend:** Python 3.12 · FastAPI · SQLAlchemy 2.0 · Alembic · PostgreSQL 16
- **Frontend:** React 19 · TypeScript · TanStack Query · CSS Modules · Recharts
- **Infra:** Docker Compose · Nginx (prod) · Gunicorn (prod)

## Quick Start

```bash
cp .env.example .env
make dev
```

- Frontend: http://localhost:5173
- API: http://localhost:8000/api
- Docs: http://localhost:8000/docs

Seed com dados de exemplo:

```bash
make seed
```

Cria usuário admin (`admin`/`admin123`), 7 jogadores (senha `1234`) e ~45 dias de histórico.

## Comandos

| Comando | Descrição |
|---------|-----------|
| `make dev` | Sobe ambiente de desenvolvimento |
| `make prod` | Build e start em produção (porta 80) |
| `make down` | Para os containers |
| `make logs` | Acompanha logs |
| `make migrate` | Roda migrations pendentes |
| `make migration` | Cria nova migration |
| `make seed` | Popula banco com dados de dev |
| `make typecheck` | Verifica tipos do frontend |
| `make clean` | Remove containers, volumes e imagens |

## Regras de Negócio

- **Vitória por jogo:** menor número de tentativas vence. Empate = vitória compartilhada.
- **Campeão do dia:** mais vitórias entre quem completou os 3 jogos (tríade). Desempate: menor soma de tentativas.
- **Registro:** cada jogador registra apenas o próprio resultado, apenas no dia atual (fuso America/Manaus). Editável até meia-noite.
- **Streaks:** dias consecutivos jogando (play streak) e dias consecutivos vencendo pelo menos 1 jogo (win streak).

## Estrutura

```
├── docker-compose.yml          # Dev
├── docker-compose.prod.yml     # Produção
├── Makefile
├── backend/
│   ├── app/
│   │   ├── auth/               # Signup, login, JWT, avatar
│   │   ├── scores/             # Registro e edição de scores
│   │   ├── ranking/            # Rankings, recordes, comparação
│   │   ├── dashboard/          # Dashboard com tríade e destaques
│   │   ├── admin/              # Gestão de usuários e scores
│   │   └── exceptions.py       # Exceções de domínio
│   └── alembic/                # Migrations
└── frontend/
    └── src/
        ├── api/                # Client HTTP e hooks TanStack Query
        ├── pages/              # Dashboard, Submit, Ranking, History, Login
        ├── components/         # Avatar, Card, Layout, Skeleton, etc.
        ├── context/            # Auth e Toast providers
        └── types/              # Interfaces TypeScript
```
