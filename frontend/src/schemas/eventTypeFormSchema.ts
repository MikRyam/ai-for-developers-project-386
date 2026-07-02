import { z } from 'zod';

export const eventTypeFormSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  durationMinutes: z
    .number()
    .int('Duration must be an integer')
    .positive('Duration must be positive'),
});

export type EventTypeFormValues = z.infer<typeof eventTypeFormSchema>;
