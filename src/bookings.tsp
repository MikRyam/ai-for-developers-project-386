using TypeSpec.Http;

namespace BookingService;

@doc("Bookings management")
interface Bookings {
  @doc("Book a slot. Returns 409 if the slot is already taken")
  @route("/bookings")
  @post
  createBooking(...BookingCreate): {
    @statusCode _: 201;
    @body body: Booking;
  } | {
    @statusCode _: 409;
    @body body: ErrorResponse;
  };

  @doc("List all upcoming bookings sorted by startTime")
  @route("/bookings")
  @get
  listBookings(): Booking[];
}
