import "fastify";
declare module "fastify" {
  interface FastifyInstance {
    apiConfig: { service: string; version: string; environment: string };
  }
}
