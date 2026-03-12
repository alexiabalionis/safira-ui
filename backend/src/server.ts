import { app } from "./app";
import { connectDatabase, disconnectDatabase } from "./config/database";
import { env } from "./config/env";
import { ensureBootstrapAdmin } from "./services/auth-bootstrap.service";

function logEnvConfig() {
  const runtimeEnv =
    process.env.APP_ENV ?? process.env.NODE_ENV ?? "development";
  const mongoUri =
    env.MONGODB_URI?.replace(/mongodb.*@/, "mongodb+srv://***@") ?? "not set";
  const jwtStatus = env.JWT_SECRET ? "configured" : "not set";
  const wayApiBase = env.WAY_API_BASE_URL ?? "not set";

  console.log("\n═══════════════════════════════════════════════════════════");
  console.log("🚀 Safira Backend - Environment Configuration");
  console.log("═══════════════════════════════════════════════════════════");
  console.log(`Environment: ${runtimeEnv}`);
  console.log(`Node Env: ${env.NODE_ENV}`);
  console.log(`Port: ${env.PORT}`);
  console.log(`Database: ${mongoUri}`);
  console.log(`Database Name: ${env.MONGODB_DB_NAME}`);
  console.log(`WAY API Base: ${wayApiBase}`);
  console.log(`JWT Secret: ${jwtStatus}`);
  console.log(`JWT Expires In: ${env.JWT_EXPIRES_IN}`);
  console.log("═══════════════════════════════════════════════════════════\n");
}

async function bootstrap() {
  await connectDatabase();
  await ensureBootstrapAdmin();
  logEnvConfig();

  const server = app.listen(env.PORT, () => {
    // Keep startup log explicit for operational visibility.
    console.log(`✓ Safira backend listening on port ${env.PORT}`);
  });

  const shutdown = async () => {
    server.close(async () => {
      await disconnectDatabase();
      process.exit(0);
    });
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

bootstrap().catch((error: unknown) => {
  console.error("Failed to bootstrap backend", error);
  process.exit(1);
});
