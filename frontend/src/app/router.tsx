import { createBrowserRouter } from 'react-router-dom';
import { AppLayout } from '@/components/AppLayout';
import { EventTypesListPage } from '@/features/event-types/EventTypesListPage';
import { EventTypeBookingPage } from '@/features/event-types/EventTypeBookingPage';
import { AdminBookingsPage } from '@/features/admin/AdminBookingsPage';
import { AdminEventTypesPage } from '@/features/admin/AdminEventTypesPage';
import { Text } from '@mantine/core';

export const router = createBrowserRouter([
  {
    element: <AppLayout />,
    children: [
      { path: '/', element: <EventTypesListPage /> },
      { path: '/event-types/:id', element: <EventTypeBookingPage /> },
      { path: '/admin', element: <AdminBookingsPage /> },
      { path: '/admin/event-types', element: <AdminEventTypesPage /> },
	  { path: '*', element: <Text>Page not found</Text> }
    ],
  },
]);
