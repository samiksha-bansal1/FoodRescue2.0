import { useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { queryClient } from '@/lib/queryClient';
import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export function useRealtimeUpdates() {
  const { user } = useAuth();

  useEffect(() => {
    if (!user?.id) return;

    // Initialize socket connection if not already connected
    if (!socket || !socket.connected) {
      const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
      const host = window.location.host;
      const token = localStorage.getItem('token');
      
      socket = io(window.location.origin, {
        secure: protocol === 'wss',
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: 5,
        auth: { token }
      });

      socket.on('connect', () => {
        console.log('Socket connected');
        socket?.emit('join_room', user.id);
      });

      socket.on('donation_accepted', (data: any) => {
        console.log('Donation accepted event:', data);
        // Invalidate relevant queries
        queryClient.invalidateQueries({ queryKey: ['/api/donations'] });
        queryClient.invalidateQueries({ queryKey: ['/api/donations/available'] });
        queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
      });

      socket.on('delivery_completed', (data: any) => {
        console.log('Delivery completed event:', data);
        queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
        queryClient.invalidateQueries({ queryKey: ['/api/donations'] });
      });

      socket.on('task_assigned', (data: any) => {
        console.log('Task assigned event:', data);
        queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
        queryClient.invalidateQueries({ queryKey: ['/api/donations/available'] });
      });

      socket.on('donation_rated', (data: any) => {
        console.log('Donation rated event:', data);
        queryClient.invalidateQueries({ queryKey: ['/api/donations'] });
        queryClient.invalidateQueries({ queryKey: ['/api/donations/available'] });
      });

      socket.on('notification_created', (data: any) => {
        console.log('New notification:', data);
        queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
      });

      socket.on('disconnect', () => {
        console.log('Socket disconnected');
      });
    }

    return () => {
      // Don't disconnect on unmount - keep connection alive
    };
  }, [user?.id]);

  return socket;
}
