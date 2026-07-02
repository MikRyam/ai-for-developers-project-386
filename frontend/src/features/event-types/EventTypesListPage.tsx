import { Container, SimpleGrid, Card, Text, Title, Loader, Center } from '@mantine/core';
import { Link } from 'react-router-dom';
import { useGetEventTypesQuery } from '@/api/apiSlice';

export function EventTypesListPage() {
  const { data: eventTypes, isLoading, isError } = useGetEventTypesQuery();

  if (isLoading) {
    return (
      <Center h={200}>
        <Loader />
      </Center>
    );
  }

  if (isError || !eventTypes) {
    return (
      <Container>
        <Text c="red">Failed to load event types.</Text>
      </Container>
    );
  }

  return (
    <Container>
      <Title order={2} mb="lg">
        Available Event Types
      </Title>
      <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }}>
        {eventTypes.map((et) => (
          <Card
            key={et.id}
            shadow="sm"
            padding="lg"
            withBorder
            component={Link}
            to={`/event-types/${et.id}`}
            style={{ textDecoration: 'none', color: 'inherit' }}
          >
            <Title order={4}>{et.title}</Title>
            <Text size="sm" c="dimmed" mt="xs" lineClamp={3}>
              {et.description}
            </Text>
            <Text size="sm" mt="sm">
              Duration: {et.durationMinutes} min
            </Text>
          </Card>
        ))}
      </SimpleGrid>
    </Container>
  );
}
