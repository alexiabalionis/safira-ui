import { app } from "./app";
import { connectDatabase, disconnectDatabase } from "./config/database";
import { env } from "./config/env";
import { ensureBootstrapAdmin } from "./services/auth-bootstrap.service";

async function bootstrap() {
  await connectDatabase();
  await ensureBootstrapAdmin();

  const server = app.listen(env.PORT, () => {
    // Keep startup log explicit for operational visibility.
    console.log(`Safira backend listening on port ${env.PORT}`);
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
