import type { components } from "../types/generated-types.js";
import * as store from "../store/inMemoryStore.js";

type Slot = components["schemas"]["Slot"];
type BookingCreate = components["schemas"]["BookingCreate"];
type Booking = components["schemas"]["Booking"];

export class ConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ConflictError";
  }
}

export function generateAvailableSlots(eventTypeId: string): Slot[] {
  const eventType = store.getEventType(eventTypeId);
  if (!eventType) {
    return [];
  }

  const nowMs = Date.now();
  const stepMs = eventType.durationMinutes * 60000;
  const slots: Slot[] = [];

  for (let dayOffset = 0; dayOffset < 14; dayOffset++) {
    const dateMs = nowMs + dayOffset * 86400000;
    const date = new Date(dateMs);
    const dayOfWeek = date.getUTCDay();

    if (dayOfWeek === 0 || dayOfWeek === 6) {
      continue;
    }

    const year = date.getUTCFullYear();
    const month = date.getUTCMonth();
    const day = date.getUTCDate();

    const windowStartMs = Date.UTC(year, month, day, 9, 0, 0);
    const windowEndMs = Date.UTC(year, month, day, 18, 0, 0);

    let cursorMs = windowStartMs;

    while (cursorMs + stepMs <= windowEndMs) {
      if (cursorMs > nowMs) {
        const endMs = cursorMs + stepMs;
        if (!hasConflict(cursorMs, endMs)) {
          slots.push({
            startTime: new Date(cursorMs).toISOString(),
            endTime: new Date(endMs).toISOString(),
          });
        }
      }
      cursorMs += stepMs;
    }
  }

  return slots;
}

function hasConflict(startMs: number, endMs: number): boolean {
  for (const booking of store.getBookings()) {
    const bookingStartMs = new Date(booking.startTime).getTime();
    const bookingEndMs = new Date(booking.endTime).getTime();

    if (startMs < bookingEndMs && endMs > bookingStartMs) {
      return true;
    }
  }
  return false;
}

export function createBooking(payload: BookingCreate): Booking {
  const eventType = store.getEventType(payload.eventTypeId);
  if (!eventType) {
    throw new ConflictError("Event type does not exist");
  }

  const startMs = new Date(payload.startTime).getTime();
  if (isNaN(startMs)) {
    throw new ConflictError("Invalid startTime");
  }

  const endMs = startMs + eventType.durationMinutes * 60000;

  for (const existing of store.getBookings()) {
    const existingStartMs = new Date(existing.startTime).getTime();
    const existingEndMs = new Date(existing.endTime).getTime();

    if (startMs < existingEndMs && endMs > existingStartMs) {
      throw new ConflictError("Time slot is already booked");
    }
  }

  const booking: Booking = {
    id: crypto.randomUUID(),
    eventTypeId: payload.eventTypeId,
    startTime: new Date(startMs).toISOString(),
    endTime: new Date(endMs).toISOString(),
    guestName: payload.guestName,
    guestEmail: payload.guestEmail,
    createdAt: new Date().toISOString(),
  };

  return store.addBooking(booking);
}
