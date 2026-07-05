import { useState, useMemo, useEffect, useRef } from 'react';
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
  Grid,
  Badge,
  Divider,
  ScrollArea,
} from '@mantine/core';
import { Calendar } from '@mantine/dates';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useDisclosure } from '@mantine/hooks';
import { skipToken } from '@reduxjs/toolkit/query/react';
import dayjs from 'dayjs';
import {
  useGetEventTypeQuery,
  useGetSlotsQuery,
  useCreateBookingMutation,
} from '@/api/apiSlice';
import {
  bookingFormSchema,
  type BookingFormValues,
} from '@/schemas/bookingFormSchema';
import { formatDateTime } from '@/utils/formatDateTime';

function formatTime(iso: string): string {
  return dayjs(iso).format('HH:mm');
}

function extractDate(iso: string): string {
  return dayjs(iso).format('YYYY-MM-DD');
}

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
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [confirmedBooking, setConfirmedBooking] = useState<{
    startTime: string;
    endTime: string;
  } | null>(null);
  const [opened, { open, close }] = useDisclosure(false);

  const timeZone = useMemo(
    () => Intl.DateTimeFormat().resolvedOptions().timeZone,
    [],
  );

  const today = useMemo(() => dayjs().format('YYYY-MM-DD'), []);
  const maxDateStr = useMemo(
    () => dayjs().add(13, 'day').format('YYYY-MM-DD'),
    [],
  );

  const slotsByDate = useMemo(() => {
    const map = new Map<string, typeof slots>();
    slots?.forEach((slot) => {
      const dateKey = extractDate(slot.startTime);
      if (!map.has(dateKey)) {
        map.set(dateKey, []);
      }
      map.get(dateKey)!.push(slot);
    });
    return map;
  }, [slots]);

  const firstAvailableDate = useMemo(() => {
    const keys = [...slotsByDate.keys()].sort();
    if (keys.length > 0) return keys[0];
    return null;
  }, [slotsByDate]);

  const initialized = useRef(false);

  useEffect(() => {
    if (!initialized.current && firstAvailableDate) {
      setSelectedDate(firstAvailableDate);
      initialized.current = true;
    }
  }, [firstAvailableDate]);

  useEffect(() => {
    if (selectedDate && (slotsByDate.get(selectedDate) ?? []).length === 0 && firstAvailableDate) {
      setSelectedDate(firstAvailableDate);
    }
  }, [selectedDate, slotsByDate, firstAvailableDate]);

  const slotsForSelectedDate = selectedDate
    ? slotsByDate.get(selectedDate) ?? []
    : [];

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

  const handleDateChange = (date: string) => {
    setSelectedDate(date);
    setSelectedSlot(null);
    setBookingError(null);
  };

  return (
    <Container fluid>
      <Grid maw={1400} mx="auto" gap="lg" align="flex-start">
        <Grid.Col span={{ base: 12, md: 3 }}>
          <Stack gap="md">
            <Title order={2}>{eventType.title}</Title>
            <Text c="dimmed">{eventType.description}</Text>
            <Group>
              <Badge variant="light" size="lg">
                {eventType.durationMinutes} min
              </Badge>
            </Group>
            <Text size="sm" c="dimmed">
              Time zone: {timeZone}
            </Text>
          </Stack>
        </Grid.Col>

        <Grid.Col span={{ base: 12, md: 4 }}>
          <Card withBorder padding="md">
            <Calendar
              fullWidth
              hideOutsideDates
              minDate={today}
              maxDate={maxDateStr}
              getDayProps={(date) => ({
                disabled: !slotsByDate.has(date),
                selected: date === selectedDate,
                onClick: () => handleDateChange(date),
              })}
            />
          </Card>
        </Grid.Col>

        <Grid.Col span={{ base: 12, md: 5 }}>
          <Card withBorder padding="md">
            {!selectedDate ? (
              <Text c="dimmed" ta="center">
                Select a date to see available time slots
              </Text>
            ) : (
              <>
                <Title order={4} mb="md">
                  {dayjs(selectedDate).format('dddd, MMMM D')}
                </Title>

                {slotsForSelectedDate.length === 0 ? (
                  <Text c="dimmed">No slots available for this date.</Text>
                ) : (
                  <ScrollArea.Autosize mah={400}>
                    <Stack gap="xs">
                      {slotsForSelectedDate.map((slot) => {
                        const isSelected = selectedSlot === slot.startTime;
                        return (
                          <Card
                            key={slot.startTime}
                            data-testid="slot-card"
                            data-start-time={slot.startTime}
                            withBorder
                            padding="sm"
                            onClick={() => {
                              setSelectedSlot(slot.startTime);
                              setBookingError(null);
                            }}
                            style={{
                              cursor: 'pointer',
                              borderColor: isSelected
                                ? 'var(--mantine-color-blue-filled)'
                                : undefined,
                            }}
                          >
                            <Group justify="space-between">
                              <div>
                                <Text>
                                  {formatTime(slot.startTime)}
                                </Text>
                                <Text size="sm" c="dimmed">
                                  → {formatTime(slot.endTime)}
                                </Text>
                              </div>
                              {isSelected && (
                                <Button
                                  size="xs"
                                  variant="light"
                                  color="blue"
                                >
                                  Selected
                                </Button>
                              )}
                            </Group>
                          </Card>
                        );
                      })}
                    </Stack>
                  </ScrollArea.Autosize>
                )}

                <Divider my="md" />

                {selectedSlot ? (
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
                ) : (
                  <Text c="dimmed" ta="center">
                    Select a time slot to continue
                  </Text>
                )}
              </>
            )}
          </Card>
        </Grid.Col>
      </Grid>

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
