# Safira

Aplicacao em monorepo com:

- frontend: Next.js
- backend: Node.js + Express
- banco: MongoDB

## Como rodar em producao

```bash
docker-compose build
docker-compose up -d
```

## Publicar imagens no Docker Hub

```bash
docker login
docker compose build backend frontend
docker compose push backend frontend
```

Para publicar tambem uma tag de versao:

```bash
docker tag balionisalexia/safira-backend:latest balionisalexia/safira-backend:v1.0.0
docker tag balionisalexia/safira-frontend:latest balionisalexia/safira-frontend:v1.0.0
docker push balionisalexia/safira-backend:v1.0.0
docker push balionisalexia/safira-frontend:v1.0.0
```

## Portas publicas

- Frontend: `http://localhost:3000`
- Backend: `http://localhost:3333`
- MongoDB: `localhost:27017`

## Variaveis de ambiente (opcionais)

As variaveis abaixo podem ser definidas no shell antes de subir os containers:

- `NEXT_PUBLIC_API_URL` (padrao: `http://localhost:3333`)
- `SAFIRA_API_INTERNAL_URL` (padrao: `http://backend:3333`)
- `JWT_SECRET` (padrao de desenvolvimento no compose; em producao, defina um segredo forte)
- `WAY_API_BASE_URL`, `WAY_API_TOKEN`, `WAY_API_TOKEN_WHITELABEL`, `WAY_API_COOKIE`, `WAY_API_REFERER`
- `BOOTSTRAP_ADMIN_NAME`, `BOOTSTRAP_ADMIN_EMAIL`, `BOOTSTRAP_ADMIN_PASSWORD`

## Troubleshooting rapido

Se o frontend ficar carregando indefinidamente:

1. Verifique status dos containers:

```bash
docker compose ps -a
```

2. Verifique logs:

```bash
docker compose logs --tail=200 frontend
docker compose logs --tail=200 backend
```

3. Teste conectividade local:

```bash
curl http://localhost:3000
curl http://localhost:3333/health
```

4. Rebuild sem cache em caso de variavel antiga no bundle:

```bash
docker compose down
docker compose build --no-cache
docker compose up -d
```

## Replicar os mesmos dados locais em outro deploy

Objetivo: permitir que outra pessoa suba o ambiente com o mesmo conteudo do seu banco local.

1. No seu ambiente, exporte o banco local para seed:

```bash
make seed-export
```

2. Compartilhe o projeto com a pasta `docker/mongo/seed` (ela contem o dump).

3. Na maquina de destino, suba os containers normalmente:

```bash
docker-compose build
docker-compose up -d
```

O Mongo restaura automaticamente o seed no primeiro boot do volume.

## Comandos uteis de seed

- Exportar dump do Mongo local: `make seed-export`
- Importar dump manualmente em container ja em execucao: `make seed-import`

Observacoes:

- O `seed-export` usa por padrao `mongodb://host.docker.internal:27017/safira`.
- Para outro host/porta, sobrescreva: `make seed-export MONGO_SEED_SOURCE_URI="mongodb://<host>:<porta>/safira"`.
- O restore automatico roda apenas quando o volume do Mongo esta vazio (primeira inicializacao).
