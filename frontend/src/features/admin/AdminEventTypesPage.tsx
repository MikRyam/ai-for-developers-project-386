import { useState } from 'react';
import {
  Container,
  Title,
  Card,
  Text,
  Button,
  Stack,
  TextInput,
  NumberInput,
  SimpleGrid,
  Loader,
  Center,
  Alert,
} from '@mantine/core';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useGetEventTypesQuery, useCreateEventTypeMutation } from '@/api/apiSlice';
import {
  eventTypeFormSchema,
  type EventTypeFormValues,
} from '@/schemas/eventTypeFormSchema';

export function AdminEventTypesPage() {
  const { data: eventTypes, isLoading } = useGetEventTypesQuery();
  const [createEventType, { isLoading: creating }] =
    useCreateEventTypeMutation();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    reset,
  } = useForm<EventTypeFormValues>({
    resolver: zodResolver(eventTypeFormSchema),
  });

  const onSubmit = async (data: EventTypeFormValues) => {
    try {
      await createEventType({
        title: data.title,
        description: data.description,
        durationMinutes: data.durationMinutes,
      }).unwrap();
      reset();
      setSubmitError(null);
    } catch {
      setSubmitError('Failed to create event type. Please try again.');
    }
  };

  return (
    <Container>
      <Title order={2} mb="lg">
        Event Types
      </Title>

      <Card withBorder padding="lg" mb="xl">
        <Title order={4} mb="md">
          Create Event Type
        </Title>
        <form onSubmit={handleSubmit(onSubmit)}>
          <Stack>
            <TextInput
              label="Title"
              placeholder="30 min meeting"
              {...register('title')}
              error={errors.title?.message}
            />
            <TextInput
              label="Description"
              placeholder="A quick catch-up"
              {...register('description')}
              error={errors.description?.message}
            />
            <Controller
              name="durationMinutes"
              control={control}
              render={({ field }) => (
                <NumberInput
                  label="Duration (minutes)"
                  placeholder="30"
                  min={1}
                  value={field.value ?? ''}
                  onChange={(value) =>
                    field.onChange(
                      typeof value === 'string' ? parseInt(value, 10) || 0 : (value ?? 0),
                    )
                  }
                  error={errors.durationMinutes?.message}
                />
              )}
            />
            {submitError && (
              <Alert color="red" title="Error">
                {submitError}
              </Alert>
            )}
            <Button type="submit" loading={creating}>
              Create
            </Button>
          </Stack>
        </form>
      </Card>

      {isLoading ? (
        <Center h={200}>
          <Loader />
        </Center>
      ) : !eventTypes || eventTypes.length === 0 ? (
        <Text c="dimmed">No event types created yet.</Text>
      ) : (
        <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }}>
          {eventTypes.map((et) => (
            <Card key={et.id} withBorder padding="lg">
              <Text fw={500}>{et.title}</Text>
              <Text size="sm" c="dimmed" mt="xs" lineClamp={2}>
                {et.description}
              </Text>
              <Text size="sm" mt="sm">
                {et.durationMinutes} min
              </Text>
            </Card>
          ))}
        </SimpleGrid>
      )}
    </Container>
  );
}
