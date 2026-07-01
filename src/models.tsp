@doc("UUID identifier")
@format("uuid")
scalar Uuid extends string;

@doc("Error response returned on 4xx failures")
@error
model ErrorResponse {
  code: int32;
  message: string;
}

@doc("Type of event that can be booked")
model EventType {
  id: Uuid;
  title: string;
  description: string;
  durationMinutes: int32;
}

@doc("Available time slot for booking")
model Slot {
  startTime: utcDateTime;
  endTime: utcDateTime;
}

@doc("A booking made by a guest")
model Booking {
  id: Uuid;
  eventTypeId: Uuid;
  startTime: utcDateTime;
  endTime: utcDateTime;
  guestName: string;
  guestEmail: string;
  createdAt: utcDateTime;
}

@doc("Payload to create a new event type")
model EventTypeCreate {
  title: string;
  description: string;
  durationMinutes: int32;
}

@doc("Payload to create a new booking")
model BookingCreate {
  eventTypeId: Uuid;
  startTime: utcDateTime;
  guestName: string;
  guestEmail: string;
}
