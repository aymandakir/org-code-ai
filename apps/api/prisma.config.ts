import "dotenv/config";
import { defineConfig } from "prisma";

export default defineConfig({
  datasource: {
    url: process.env["DATABASE_URL"] || "postgresql://postgres:postgres@localhost:5432/orgcodeai",
  },
});

