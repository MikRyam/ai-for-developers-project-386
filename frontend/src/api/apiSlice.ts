import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { components } from '@/api/generated-types';

type EventType = components['schemas']['EventType'];
type EventTypeCreate = components['schemas']['EventTypeCreate'];
type Booking = components['schemas']['Booking'];
type BookingCreate = components['schemas']['BookingCreate'];
type Slot = components['schemas']['Slot'];
export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl: import.meta.env.PROD ? '' : import.meta.env.VITE_API_BASE_URL,
  }),
  tagTypes: ['EventType', 'Booking', 'Slot'],
  endpoints: (builder) => ({
    getEventTypes: builder.query<EventType[], void>({
      query: () => '/event-types',
      providesTags: ['EventType'],
    }),

    getEventType: builder.query<EventType, { id: string }>({
      query: ({ id }) => `/event-types/${id}`,
      providesTags: (_result, _error, { id }) => [{ type: 'EventType', id }],
    }),

    getSlots: builder.query<Slot[], { id: string }>({
      query: ({ id }) => `/event-types/${id}/slots`,
      providesTags: (_result, _error, { id }) => [{ type: 'Slot', id }],
    }),

    createEventType: builder.mutation<EventType, EventTypeCreate>({
      query: (body) => ({
        url: '/event-types',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['EventType'],
    }),

    createBooking: builder.mutation<
      Booking,
      BookingCreate
    >({
      query: (body) => ({
        url: '/bookings',
        method: 'POST',
        body,
      }),
      invalidatesTags: (_result, _error, arg) => [
        'Booking',
        { type: 'Slot', id: arg.eventTypeId },
      ],
    }),

    getBookings: builder.query<Booking[], void>({
      query: () => '/bookings',
      providesTags: ['Booking'],
    }),
  }),
});

export const {
  useGetEventTypesQuery,
  useGetEventTypeQuery,
  useGetSlotsQuery,
  useCreateEventTypeMutation,
  useCreateBookingMutation,
  useGetBookingsQuery,
} = apiSlice;
