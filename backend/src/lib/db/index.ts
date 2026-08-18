import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"
import * as schema from "./schema"

const connectionString = process.env.DATABASE_URL ?? ""

const client = postgres(connectionString, {
  // Supabase transaction pooler (port 6543) is PgBouncer in transaction
  // mode, which does not support prepared statements.
  prepare: false,
  // Keep the per-instance pool small so we don't exhaust the pooler's
  // connection cap (especially on free tier).
  max: 5,
  // Release idle connections instead of holding them open forever.
  idle_timeout: 20,
  // Fail fast instead of hanging the full request for 30s.
  connect_timeout: 10,
})
export const db = drizzle(client, { schema, casing: "snake_case" })

export type DbConnection = Pick<
  typeof db,
  "insert" | "select" | "update" | "delete"
>
