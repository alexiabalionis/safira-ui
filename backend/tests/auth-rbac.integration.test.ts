import bcrypt from "bcryptjs";
import assert from "node:assert/strict";
import { after, afterEach, before, describe, it } from "node:test";
import type { Express } from "express";
import { MongoMemoryServer } from "mongodb-memory-server";
import request from "supertest";

import type { UserRole } from "../src/models/user.model";

type UserModelType = {
  create: (payload: {
    nome: string;
    email: string;
    role: UserRole;
    passwordHash: string;
    forcePasswordChange: boolean;
    ativo: boolean;
  }) => Promise<{ _id: string }>;
  deleteMany: (filter: Record<string, unknown>) => Promise<unknown>;
};

let mongoServer: MongoMemoryServer;
let app: Express;
let connectDatabase: () => Promise<void>;
let disconnectDatabase: () => Promise<void>;
let UserModel: UserModelType;

async function seedUser(params: {
  nome: string;
  email: string;
  role: UserRole;
  password: string;
  forcePasswordChange?: boolean;
  ativo?: boolean;
}) {
  const passwordHash = await bcrypt.hash(params.password, 12);

  const user = await UserModel.create({
    nome: params.nome,
    email: params.email.toLowerCase(),
    role: params.role,
    passwordHash,
    forcePasswordChange: params.forcePasswordChange ?? false,
    ativo: params.ativo ?? true,
  });

  return String(user._id);
}

async function loginWithAgent(
  agent: request.SuperAgentTest,
  payload: {
    email: string;
    senha: string;
  },
) {
  return agent.post("/api/auth/login").send(payload);
}

describe("Auth + RBAC integration", () => {
  before(async () => {
    mongoServer = await MongoMemoryServer.create();

    process.env.NODE_ENV = "test";
    process.env.MONGODB_URI = mongoServer.getUri();
    process.env.MONGODB_DB_NAME = "safira_backend_test";
    process.env.JWT_SECRET = "test-secret-key-with-at-least-32-characters";
    process.env.JWT_EXPIRES_IN = "8h";
    process.env.AUTH_COOKIE_NAME = "safira_token";

    const databaseModule = await import("../src/config/database");
    connectDatabase = databaseModule.connectDatabase;
    disconnectDatabase = databaseModule.disconnectDatabase;

    const appModule = await import("../src/app");
    app = appModule.app;

    const userModule = await import("../src/models/user.model");
    UserModel = userModule.UserModel as unknown as UserModelType;

    await connectDatabase();
  });

  afterEach(async () => {
    await UserModel.deleteMany({});
  });

  after(async () => {
    await disconnectDatabase();
    await mongoServer.stop();
  });

  it("faz login e retorna flag forcePasswordChange no primeiro acesso", async () => {
    await seedUser({
      nome: "Operador Primeiro Acesso",
      email: "operador.primeiro@safira.test",
      role: "operador",
      password: "SenhaTemp@123",
      forcePasswordChange: true,
    });

    const response = await request(app).post("/api/auth/login").send({
      email: "operador.primeiro@safira.test",
      senha: "SenhaTemp@123",
    });

    assert.equal(response.status, 200);
    assert.equal(response.body.user.forcePasswordChange, true);
    assert.ok(response.headers["set-cookie"]);
  });

  it("bloqueia rota protegida ate trocar senha e libera apos change-password", async () => {
    await seedUser({
      nome: "Operador Fluxo",
      email: "operador.fluxo@safira.test",
      role: "operador",
      password: "Temp@12345",
      forcePasswordChange: true,
    });

    const agent = request.agent(app);

    const loginResponse = await loginWithAgent(agent, {
      email: "operador.fluxo@safira.test",
      senha: "Temp@12345",
    });

    assert.equal(loginResponse.status, 200);
    assert.equal(loginResponse.body.user.forcePasswordChange, true);

    const blockedResponse = await agent.get("/api/postos");
    assert.equal(blockedResponse.status, 403);

    const changePasswordResponse = await agent
      .post("/api/auth/change-password")
      .send({
        currentPassword: "Temp@12345",
        newPassword: "NovaSenha@123",
      });

    assert.equal(changePasswordResponse.status, 200);
    assert.equal(changePasswordResponse.body.user.forcePasswordChange, false);

    const allowedResponse = await agent.get("/api/postos");
    assert.equal(allowedResponse.status, 200);
  });

  it("aplica matriz RBAC para visitante, operador e admin", async () => {
    await seedUser({
      nome: "Visitante",
      email: "visitante@safira.test",
      role: "visitante",
      password: "SenhaVisit@123",
    });
    await seedUser({
      nome: "Operador",
      email: "operador@safira.test",
      role: "operador",
      password: "SenhaOper@123",
    });
    await seedUser({
      nome: "Admin",
      email: "admin@safira.test",
      role: "admin",
      password: "SenhaAdmin@123",
    });

    const visitanteAgent = request.agent(app);
    const operadorAgent = request.agent(app);
    const adminAgent = request.agent(app);

    assert.equal(
      (
        await loginWithAgent(visitanteAgent, {
          email: "visitante@safira.test",
          senha: "SenhaVisit@123",
        })
      ).status,
      200,
    );

    assert.equal(
      (
        await loginWithAgent(operadorAgent, {
          email: "operador@safira.test",
          senha: "SenhaOper@123",
        })
      ).status,
      200,
    );

    assert.equal(
      (
        await loginWithAgent(adminAgent, {
          email: "admin@safira.test",
          senha: "SenhaAdmin@123",
        })
      ).status,
      200,
    );

    assert.equal(
      (await visitanteAgent.get("/api/dashboard/overview")).status,
      200,
    );
    assert.equal((await visitanteAgent.get("/api/postos")).status, 403);
    assert.equal((await visitanteAgent.get("/api/clientes")).status, 403);

    assert.equal(
      (await operadorAgent.get("/api/dashboard/overview")).status,
      200,
    );
    assert.equal((await operadorAgent.get("/api/postos")).status, 200);
    assert.equal((await operadorAgent.get("/api/clientes")).status, 403);

    assert.equal((await adminAgent.get("/api/dashboard/overview")).status, 200);
    assert.equal((await adminAgent.get("/api/postos")).status, 200);
    assert.equal((await adminAgent.get("/api/clientes")).status, 200);
  });

  it("permite administracao de usuarios com ativar/desativar e reset de senha temporaria", async () => {
    await seedUser({
      nome: "Admin Master",
      email: "admin.master@safira.test",
      role: "admin",
      password: "AdminMaster@123",
    });

    const adminAgent = request.agent(app);
    const loginAdmin = await loginWithAgent(adminAgent, {
      email: "admin.master@safira.test",
      senha: "AdminMaster@123",
    });
    assert.equal(loginAdmin.status, 200);

    const createResponse = await adminAgent.post("/api/auth/users").send({
      nome: "Usuario Operacional",
      email: "operacional@safira.test",
      role: "operador",
      temporaryPassword: "TempInicial@123",
    });

    assert.equal(createResponse.status, 201);
    const createdUserId = String(createResponse.body.user.id);

    const listResponse = await adminAgent.get("/api/auth/users");
    assert.equal(listResponse.status, 200);
    assert.equal(listResponse.body.total >= 2, true);
    assert.equal(
      listResponse.body.data.some(
        (item: { id: string; email: string; passwordHash?: string }) =>
          item.id === createdUserId &&
          item.email === "operacional@safira.test" &&
          item.passwordHash === undefined,
      ),
      true,
    );

    const deactivateResponse = await adminAgent
      .patch(`/api/auth/users/${createdUserId}/status`)
      .send({ ativo: false });
    assert.equal(deactivateResponse.status, 200);
    assert.equal(deactivateResponse.body.user.ativo, false);

    const roleUpdateResponse = await adminAgent
      .patch(`/api/auth/users/${createdUserId}/role`)
      .send({ role: "visitante" });
    assert.equal(roleUpdateResponse.status, 200);
    assert.equal(roleUpdateResponse.body.user.role, "visitante");

    const blockedLogin = await request(app).post("/api/auth/login").send({
      email: "operacional@safira.test",
      senha: "TempInicial@123",
    });
    assert.equal(blockedLogin.status, 401);

    const resetResponse = await adminAgent
      .post(`/api/auth/users/${createdUserId}/reset-password`)
      .send({ temporaryPassword: "NovaTemp@123" });
    assert.equal(resetResponse.status, 200);
    assert.equal(resetResponse.body.user.forcePasswordChange, true);
    assert.equal(resetResponse.body.user.ativo, true);

    const loginAfterReset = await request(app).post("/api/auth/login").send({
      email: "operacional@safira.test",
      senha: "NovaTemp@123",
    });

    assert.equal(loginAfterReset.status, 200);
    assert.equal(loginAfterReset.body.user.forcePasswordChange, true);
  });
});
