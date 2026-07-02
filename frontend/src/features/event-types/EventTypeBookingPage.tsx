import { useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  Container,
  Title,
  Text,
  Loader,
  Center,
  Card,
  Group,
  Button,
  Modal,
  Stack,
  TextInput,
  Alert,
} from '@mantine/core';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useDisclosure } from '@mantine/hooks';
import { skipToken } from '@reduxjs/toolkit/query/react';
import {
  useGetEventTypeQuery,
  useGetSlotsQuery,
  useCreateBookingMutation,
} from '@/api/apiSlice';
import {
  bookingFormSchema,
  type BookingFormValues,
} from '@/schemas/bookingFormSchema';

export function EventTypeBookingPage() {
  const { id } = useParams<{ id: string }>();
  const { data: eventType, isLoading: loadingEventType } = useGetEventTypeQuery(
    id ? { id } : skipToken,
  );
  const { data: slots, isLoading: loadingSlots } = useGetSlotsQuery(
    id ? { id } : skipToken,
  );
  const [createBooking, { isLoading: creatingBooking }] =
    useCreateBookingMutation();

  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [confirmedBooking, setConfirmedBooking] = useState<{
    startTime: string;
    endTime: string;
  } | null>(null);
  const [opened, { open, close }] = useDisclosure(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<BookingFormValues>({
    resolver: zodResolver(bookingFormSchema),
  });

  if (loadingEventType || loadingSlots) {
    return (
      <Center h={200}>
        <Loader />
      </Center>
    );
  }

  if (!eventType) {
    return (
      <Container>
        <Text c="red">Event type not found.</Text>
      </Container>
    );
  }

  const onSubmit = async (data: BookingFormValues) => {
    if (!selectedSlot || !id) return;

    setBookingError(null);

    try {
      const result = await createBooking({
        eventTypeId: id,
        startTime: selectedSlot,
        guestName: data.guestName,
        guestEmail: data.guestEmail,
      }).unwrap();

      setConfirmedBooking({
        startTime: result.startTime,
        endTime: result.endTime,
      });
      open();
      reset();
      setSelectedSlot(null);
    } catch (err: unknown) {
      const error = err as { status?: number; data?: { message?: string } };
      if (error?.status === 409) {
        setBookingError(
          error?.data?.message ?? 'This slot is already booked.',
        );
      } else {
        setBookingError('Failed to create booking. Please try again.');
      }
    }
  };

  const formatDateTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleString();
  };

  return (
    <Container>
      <Title order={2}>{eventType.title}</Title>
      <Text c="dimmed" mt="xs">
        {eventType.description}
      </Text>
      <Text size="sm" mt="sm">
        Duration: {eventType.durationMinutes} minutes
      </Text>

      <Title order={3} mt="xl" mb="md">
        Available Slots
      </Title>

      {slots && slots.length === 0 && (
        <Text c="dimmed">No available slots for the next 14 days.</Text>
      )}

      <Stack>
        {slots?.map((slot) => {
          const isSelected = selectedSlot === slot.startTime;
          return (
            <Card
              key={slot.startTime}
              withBorder
              padding="sm"
              style={{
                cursor: 'pointer',
                borderColor: isSelected
                  ? 'var(--mantine-color-blue-filled)'
                  : undefined,
              }}
              onClick={() => {
                setSelectedSlot(slot.startTime);
                setBookingError(null);
              }}
            >
              <Group justify="space-between">
                <div>
                  <Text>{formatDateTime(slot.startTime)}</Text>
                  <Text size="sm" c="dimmed">
                    → {formatDateTime(slot.endTime)}
                  </Text>
                </div>
                {isSelected && (
                  <Button size="xs" variant="light" color="blue">
                    Selected
                  </Button>
                )}
              </Group>
            </Card>
          );
        })}
      </Stack>

      {selectedSlot && (
        <Card withBorder mt="xl" padding="lg">
          <Title order={4} mb="md">
            Complete Booking
          </Title>
          <form onSubmit={handleSubmit(onSubmit)}>
            <Stack>
              <TextInput
                label="Your Name"
                placeholder="John Doe"
                {...register('guestName')}
                error={errors.guestName?.message}
              />
              <TextInput
                label="Email"
                placeholder="john@example.com"
                {...register('guestEmail')}
                error={errors.guestEmail?.message}
              />
              {bookingError && (
                <Alert color="red" title="Booking failed">
                  {bookingError}
                </Alert>
              )}
              <Button type="submit" loading={creatingBooking}>
                Confirm Booking
              </Button>
            </Stack>
          </form>
        </Card>
      )}

      <Modal
        opened={opened}
        onClose={close}
        title="Booking Confirmed"
        centered
      >
        {confirmedBooking && (
          <Stack>
            <Text>Your booking has been confirmed!</Text>
            <Text size="sm">
              Start: {formatDateTime(confirmedBooking.startTime)}
            </Text>
            <Text size="sm">
              End: {formatDateTime(confirmedBooking.endTime)}
            </Text>
            <Button onClick={close} fullWidth mt="md">
              Done
            </Button>
          </Stack>
        )}
      </Modal>
    </Container>
  );
}
