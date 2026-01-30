import "dotenv/config";
import postgres from "postgres";
import { Kysely, PostgresDialect } from "kysely";
import { Pool } from "pg";

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }, // IMPORTANT for Neon/Supabase
  max: 10,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 10_000,
});

export const db = new Kysely({
  dialect: new PostgresDialect({
    pool: pool,
  }),
});

pool.on("error", (err) => {
  console.error("❌ Unexpected PG pool error:", err.message);
});
console.log("✅ DB initialized");
