export const openApiSpec = {
  openapi: "3.0.3",
  info: {
    title: "Safira Backend API",
    version: "1.0.0",
    description: "API para controle de automacao em postos",
  },
  servers: [
    {
      url: "http://localhost:3333",
      description: "Ambiente local",
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
      },
    },
    schemas: {
      UserRole: {
        type: "string",
        enum: ["admin", "operador", "visitante"],
      },
      User: {
        type: "object",
        properties: {
          id: { type: "string" },
          nome: { type: "string" },
          email: { type: "string", format: "email" },
          role: { $ref: "#/components/schemas/UserRole" },
          forcePasswordChange: { type: "boolean" },
          ativo: { type: "boolean" },
        },
      },
    },
  },
  paths: {
    "/health": {
      get: {
        tags: ["Health"],
        summary: "Health check",
        responses: {
          "200": {
            description: "API ativa",
          },
        },
      },
    },
    "/api/postos": {
      get: {
        tags: ["Postos"],
        summary: "Lista postos",
      },
      post: {
        tags: ["Postos"],
        summary: "Cria posto",
      },
    },
    "/api/postos/{id}": {
      get: {
        tags: ["Postos"],
        summary: "Busca posto por id",
      },
      patch: {
        tags: ["Postos"],
        summary: "Atualiza posto",
      },
      delete: {
        tags: ["Postos"],
        summary: "Remove posto",
      },
    },
    "/api/clientes": {
      get: {
        tags: ["Clientes"],
        summary: "Lista clientes",
      },
      post: {
        tags: ["Clientes"],
        summary: "Cria cliente",
      },
    },
    "/api/clientes/{id}": {
      get: {
        tags: ["Clientes"],
        summary: "Busca cliente por id",
      },
      patch: {
        tags: ["Clientes"],
        summary: "Atualiza cliente",
      },
      delete: {
        tags: ["Clientes"],
        summary: "Remove cliente",
      },
    },
    "/api/redes": {
      get: {
        tags: ["Redes"],
        summary: "Lista redes",
      },
      post: {
        tags: ["Redes"],
        summary: "Cria rede",
      },
    },
    "/api/redes/{id}": {
      get: {
        tags: ["Redes"],
        summary: "Busca rede por id",
      },
      patch: {
        tags: ["Redes"],
        summary: "Atualiza rede",
      },
      delete: {
        tags: ["Redes"],
        summary: "Remove rede",
      },
    },
    "/api/erps": {
      get: {
        tags: ["ERPs"],
        summary: "Lista ERPs",
      },
      post: {
        tags: ["ERPs"],
        summary: "Cria ERP",
      },
    },
    "/api/erps/{id}": {
      get: {
        tags: ["ERPs"],
        summary: "Busca ERP por id",
      },
      patch: {
        tags: ["ERPs"],
        summary: "Atualiza ERP",
      },
      delete: {
        tags: ["ERPs"],
        summary: "Remove ERP",
      },
    },
    "/api/importacoes/way-csv": {
      post: {
        tags: ["Importacoes"],
        summary:
          "Importa CSV de CNPJ EC e popula postos/redes/ERPs via Way API",
      },
    },
    "/api/dashboard/overview": {
      get: {
        tags: ["Dashboard"],
        summary: "Retorna visão geral de progresso de automação",
      },
    },
    "/api/auth/login": {
      post: {
        tags: ["Auth"],
        summary: "Autentica usuário e retorna sessão JWT",
      },
    },
    "/api/auth/logout": {
      post: {
        tags: ["Auth"],
        summary: "Encerra sessão atual",
        security: [{ bearerAuth: [] }],
      },
    },
    "/api/auth/me": {
      get: {
        tags: ["Auth"],
        summary: "Retorna usuário autenticado",
        security: [{ bearerAuth: [] }],
      },
    },
    "/api/auth/change-password": {
      post: {
        tags: ["Auth"],
        summary: "Troca senha do usuário autenticado",
        security: [{ bearerAuth: [] }],
      },
    },
    "/api/auth/users": {
      get: {
        tags: ["User Management"],
        summary: "Lista usuários cadastrados (admin)",
        security: [{ bearerAuth: [] }],
      },
      post: {
        tags: ["User Management"],
        summary: "Cadastra novo usuário com senha temporária (admin)",
        security: [{ bearerAuth: [] }],
      },
    },
    "/api/auth/users/{id}/status": {
      patch: {
        tags: ["User Management"],
        summary: "Ativa ou desativa usuário (admin)",
        security: [{ bearerAuth: [] }],
      },
    },
    "/api/auth/users/{id}/reset-password": {
      post: {
        tags: ["User Management"],
        summary:
          "Reseta senha temporária e força troca no próximo login (admin)",
        security: [{ bearerAuth: [] }],
      },
    },
    "/api/auth/users/{id}/role": {
      patch: {
        tags: ["User Management"],
        summary: "Atualiza role de usuário (admin)",
        security: [{ bearerAuth: [] }],
      },
    },
  },
};
