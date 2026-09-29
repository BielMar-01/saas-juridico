import "fastify";
import type { Principal } from "../auth/service.js";
declare module "fastify" {interface FastifyInstance{apiConfig:{service:string;version:string;environment:string};authenticate(request:FastifyRequest):Promise<void>;authenticateWithoutOrganization(request:FastifyRequest):Promise<void>;}interface FastifyRequest{principal:Principal|null;}}
