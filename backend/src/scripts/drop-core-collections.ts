import mongoose from "mongoose";

import { connectDatabase, disconnectDatabase } from "../config/database";
import { env } from "../config/env";

const TARGET_COLLECTIONS = ["postos", "erps", "clientes", "redes"] as const;

function hasFlag(flag: string) {
  return process.argv.includes(flag);
}

async function dropCollectionIfExists(collectionName: string) {
  const db = mongoose.connection.db;
  if (!db) {
    throw new Error("MongoDB connection is not available");
  }

  const collections = await db
    .listCollections({ name: collectionName })
    .toArray();
  if (collections.length === 0) {
    console.log(
      `[db:drop-core] Colecao '${collectionName}' nao existe. Pulando.`,
    );
    return;
  }

  await db.dropCollection(collectionName);
  console.log(
    `[db:drop-core] Colecao '${collectionName}' removida com sucesso.`,
  );
}

async function run() {
  if (!hasFlag("--yes")) {
    console.error(
      "[db:drop-core] Acao destrutiva bloqueada. Rode novamente com --yes para confirmar.",
    );
    process.exit(1);
  }

  if (env.NODE_ENV === "production" && !hasFlag("--allow-production")) {
    console.error(
      "[db:drop-core] Bloqueado em producao. Use --allow-production se realmente quiser continuar.",
    );
    process.exit(1);
  }

  await connectDatabase();

  try {
    console.log(
      `[db:drop-core] Iniciando drop das colecoes no banco '${env.MONGODB_DB_NAME}'.`,
    );

    for (const collectionName of TARGET_COLLECTIONS) {
      await dropCollectionIfExists(collectionName);
    }

    console.log("[db:drop-core] Processo finalizado.");
  } finally {
    await disconnectDatabase();
  }
}

run().catch((error: unknown) => {
  console.error("[db:drop-core] Falha ao dropar colecoes", error);
  process.exit(1);
});
