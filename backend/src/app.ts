import Fastify from "fastify";
import cors from "@fastify/cors";
import { eventTypesRoutes } from "./routes/eventTypes.js";
import { bookingsRoutes } from "./routes/bookings.js";

export async function buildApp() {
  const fastify = Fastify({ logger: true });

  await fastify.register(cors, {
    origin: "http://localhost:5173",
  });

  await fastify.register(eventTypesRoutes);
  await fastify.register(bookingsRoutes);

  return fastify;
}
