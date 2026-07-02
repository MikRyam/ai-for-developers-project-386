import { z } from 'zod';

export const bookingFormSchema = z.object({
  guestName: z.string().min(1, 'Name is required'),
  guestEmail: z.string().email('Invalid email address'),
});

export type BookingFormValues = z.infer<typeof bookingFormSchema>;
