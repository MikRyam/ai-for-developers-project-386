import { existsSync } from "fs";
import path from "path";
import Fastify from "fastify";
import cors from "@fastify/cors";
import fastifyStatic from "@fastify/static";
import { eventTypesRoutes } from "./routes/eventTypes.js";
import { bookingsRoutes } from "./routes/bookings.js";

const staticRoot = path.resolve(import.meta.dirname, "public");

export async function buildApp() {
  const fastify = Fastify({ logger: true });

  if (process.env.NODE_ENV !== "production") {
    await fastify.register(cors, {
      origin: "http://localhost:5173",
    });
  }

  await fastify.register(eventTypesRoutes);
  await fastify.register(bookingsRoutes);

  if (existsSync(staticRoot)) {
    await fastify.register(fastifyStatic, {
      root: staticRoot,
      prefix: "/",
    });

    fastify.setNotFoundHandler((request, reply) => {
      if (request.method === "GET") {
        return reply.sendFile("index.html");
      }
      return reply.status(404).send({ error: "Not Found" });
    });
  }

  return fastify;
}
