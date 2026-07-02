import { AppShell, Group, Title, Anchor } from '@mantine/core';
import { Link, Outlet } from 'react-router-dom';

export function AppLayout() {
  return (
    <AppShell
      padding="md"
      header={{ height: 60 }}
    >
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between">
          <Anchor component={Link} to="/" underline="never">
            <Title order={3}>Booking Service</Title>
          </Anchor>
          <Group>
            <Anchor component={Link} to="/admin">
              Bookings
            </Anchor>
            <Anchor component={Link} to="/admin/event-types">
              Event Types
            </Anchor>
          </Group>
        </Group>
      </AppShell.Header>
      <AppShell.Main>
        <Outlet />
      </AppShell.Main>
    </AppShell>
  );
}
