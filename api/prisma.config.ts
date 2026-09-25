import "dotenv/config";
import { defineConfig } from "prisma/config";

// NOTE: we read process.env directly instead of prisma's `env()` helper.
// `env()` throws when DATABASE_URL is unset, which broke `npm install`
// (the `postinstall` -> `prisma generate` step) on a fresh checkout before
// a .env file exists. `prisma generate` doesn't need a live connection;
// `migrate deploy` / `db seed` do, and they will fail with a clear
// connection error if the URL is wrong.
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url:
      process.env.DATABASE_URL ??
      "postgresql://postgres:postgres@localhost:5432/college_discovery",
  },
});
