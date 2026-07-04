import type { FastifyInstance } from "fastify";
import { createBooking, ConflictError } from "../services/bookingService.js";
import * as store from "../store/inMemoryStore.js";
import type { components } from "../types/generated-types.js";

type BookingCreate = components["schemas"]["BookingCreate"];

const bookingCreateSchema = {
  type: "object",
  required: ["eventTypeId", "startTime", "guestName", "guestEmail"],
  properties: {
    eventTypeId: { type: "string", format: "uuid" },
    startTime: { type: "string", format: "date-time" },
    guestName: { type: "string", minLength: 1 },
    guestEmail: { type: "string", format: "email" },
  },
  additionalProperties: false,
} as const;

export async function bookingsRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.get("/bookings", async () => {
    const now = new Date();
    return store
      .getBookings()
      .filter((b) => new Date(b.startTime) >= now)
      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
  });

  fastify.post("/bookings", { schema: { body: bookingCreateSchema } }, async (request, reply) => {
    const payload = request.body as BookingCreate;

    try {
      const booking = createBooking(payload);
      return reply.status(201).send(booking);
    } catch (err) {
      if (err instanceof ConflictError) {
        return reply.status(409).send({
          code: 409,
          message: err.message,
        });
      }
      throw err;
    }
  });
}
