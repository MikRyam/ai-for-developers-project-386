import type { FastifyInstance } from "fastify";
import * as store from "../store/inMemoryStore.js";
import { generateAvailableSlots } from "../services/bookingService.js";

const eventTypeCreateSchema = {
  type: "object",
  required: ["title", "description", "durationMinutes"],
  properties: {
    title: { type: "string", minLength: 1 },
    description: { type: "string", minLength: 1 },
    durationMinutes: { type: "integer", minimum: 1 },
  },
  additionalProperties: false,
} as const;

export async function eventTypesRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.get("/event-types", async () => {
    return store.getEventTypes();
  });

  fastify.post("/event-types", { schema: { body: eventTypeCreateSchema } }, async (request, reply) => {
    const { title, description, durationMinutes } = request.body as {
      title: string;
      description: string;
      durationMinutes: number;
    };

    const eventType = {
      id: crypto.randomUUID(),
      title,
      description,
      durationMinutes,
    };

    const created = store.addEventType(eventType);
    return reply.status(201).send(created);
  });

  fastify.get("/event-types/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    const eventType = store.getEventType(id);

    if (!eventType) {
      return reply.status(404).send({
        code: 404,
        message: "Event type not found",
      });
    }

    return eventType;
  });

  fastify.get("/event-types/:id/slots", async (request) => {
    const { id } = request.params as { id: string };
    return generateAvailableSlots(id);
  });
}
