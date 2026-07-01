import "@typespec/http";
import "@typespec/openapi3";
import "@typespec/versioning";
import "./src/models.tsp";
import "./src/event-types.tsp";
import "./src/bookings.tsp";

using TypeSpec.Http;
using TypeSpec.Versioning;

@versioned(ServiceVersions)
@service(#{
  title: "Booking Service API",
})
@doc("Simplified Cal.com clone — booking service API")
namespace BookingService {
  enum ServiceVersions {
    v1_0_0: "1.0.0",
  }
}
