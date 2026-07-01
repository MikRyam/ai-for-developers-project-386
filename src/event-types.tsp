using TypeSpec.Http;

namespace BookingService;

@doc("Event types management")
interface EventTypes {
  @doc("Create a new event type")
  @route("/event-types")
  @post
  createEventType(...EventTypeCreate): {
    @statusCode _: 201;
    @body body: EventType;
  };

  @doc("List all event types")
  @route("/event-types")
  @get
  listEventTypes(): EventType[];

  @doc("Get event type by ID")
  @route("/event-types/{id}")
  @get
  getEventType(@path id: Uuid): EventType | {
    @statusCode _: 404;
    @body body: ErrorResponse;
  };

  @doc("Get available slots for the next 14 days")
  @route("/event-types/{id}/slots")
  @get
  getSlots(@path id: Uuid): Slot[];
}
