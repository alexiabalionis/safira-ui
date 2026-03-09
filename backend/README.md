# Safira Backend

API Node.js + MongoDB para alimentar o frontend Safira.

## Stack

- Node.js 20.19+
- TypeScript
- Express
- MongoDB com Mongoose
- Zod para validacao de payloads

## Como rodar

1. Copie `.env.example` para `.env`.
2. Configure `MONGODB_URI`.
3. Instale dependencias:

```bash
npm install
```

4. Rode em modo desenvolvimento:

```bash
npm run dev
```

5. Build de producao:

```bash
npm run build
npm run start
```

## Endpoints principais

- `GET /health`
- `GET /docs`
- `GET /docs.json`
- `GET /api/postos`
- `POST /api/postos`
- `GET /api/postos/:id`
- `PATCH /api/postos/:id`
- `DELETE /api/postos/:id`
- `GET /api/clientes`
- `POST /api/clientes`
- `GET /api/redes`
- `POST /api/redes`
- `GET /api/erps`
- `POST /api/erps`
- `GET /api/erps/:id`
- `PATCH /api/erps/:id`
- `DELETE /api/erps/:id`
- `POST /api/importacoes/way-csv`

## Integracao Way API

Configure no `.env`:

- `WAY_API_BASE_URL`
- `WAY_API_TOKEN`
- `WAY_API_TOKEN_WHITELABEL` (opcional)
- `WAY_API_COOKIE` (opcional)
- `WAY_API_REFERER`

Payload da importacao:

```json
{
  "csvContent": "...conteudo CSV..."
}
```

## Modelagem de dados

### Posto

- id
- razaoSocial
- nomeFantasia
- cidade
- uf
- redeId (opcional)
- erp (opcional)
- responsavelPosto
- telefone
- email
- automacao:
  - tipo
  - etapa
  - dataEtapa
  - analistaResponsavel
- clientesQueAbastecem[]:
  - clienteId
  - cnpj
  - nome

### Cliente

- id
- cnpj
- nome

### Rede

- id
- nome
