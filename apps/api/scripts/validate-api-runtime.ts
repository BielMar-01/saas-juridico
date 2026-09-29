import { readFile } from "node:fs/promises";
import dotenv from "dotenv";
import { buildApp } from "../src/app.js";
import { createPrismaClient } from "../src/lib/prisma.js";
const env=dotenv.parse(await readFile(new URL("../.env",import.meta.url),"utf8"));
const prisma=createPrismaClient(env.DATABASE_URL);
const app=await buildApp({database:{async check(){await prisma.$queryRaw`SELECT 1`;}}});
try {
  const [health,database,docs,missing]=await Promise.all([app.inject({method:"GET",url:"/api/v1/health"}),app.inject({method:"GET",url:"/api/v1/health/database"}),app.inject({method:"GET",url:"/api/docs/json"}),app.inject({method:"GET",url:"/missing"})]);
  console.log(JSON.stringify({health:health.statusCode,database:database.statusCode,docs:docs.statusCode,notFound:missing.statusCode}));
} finally { await app.close(); await prisma.$disconnect(); }
