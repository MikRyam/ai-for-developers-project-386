import {
  Container,
  Title,
  Table,
  Text,
  Loader,
  Center,
} from '@mantine/core';
import { useGetBookingsQuery } from '@/api/apiSlice';

export function AdminBookingsPage() {
  const { data: bookings, isLoading, isError } = useGetBookingsQuery();

  if (isLoading) {
    return (
      <Center h={200}>
        <Loader />
      </Center>
    );
  }

  if (isError || !bookings) {
    return (
      <Container>
        <Text c="red">Failed to load bookings.</Text>
      </Container>
    );
  }

  const formatDateTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleString();
  };

  const rows = bookings.map((b) => (
    <Table.Tr key={b.id}>
      <Table.Td>{b.guestName}</Table.Td>
      <Table.Td>{b.guestEmail}</Table.Td>
      <Table.Td>{formatDateTime(b.startTime)}</Table.Td>
      <Table.Td>{formatDateTime(b.endTime)}</Table.Td>
    </Table.Tr>
  ));

  return (
    <Container>
      <Title order={2} mb="lg">
        Upcoming Bookings
      </Title>
      {bookings.length === 0 ? (
        <Text c="dimmed">No bookings yet.</Text>
      ) : (
        <Table highlightOnHover withTableBorder>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Guest Name</Table.Th>
              <Table.Th>Email</Table.Th>
              <Table.Th>Start Time</Table.Th>
              <Table.Th>End Time</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>{rows}</Table.Tbody>
        </Table>
      )}
    </Container>
  );
}
