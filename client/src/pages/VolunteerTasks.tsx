import { TaskList } from '@/components/volunteer/TaskList';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { queryClient } from '@/lib/queryClient';
import io from 'socket.io-client';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import L from 'leaflet';

// Fix leaflet icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

export default function VolunteerTasks() {
  const { user } = useAuth();
  const [mapCenter] = useState<[number, number]>([40.7128, -74.0060]);

  useEffect(() => {
    if (!user?.id) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    const socket = io(`${protocol}//${host}`);

    socket.on('connect', () => {
      socket.emit('join_room', user.id);
    });

    socket.on('task_assigned', () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
    });

    return () => {
      socket.disconnect();
    };
  }, [user?.id]);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold mb-2">Available Tasks</h1>
        <p className="text-muted-foreground">Accept delivery tasks and help rescue food</p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2">
          <TaskList />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Service Area Map</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-96 rounded-md overflow-hidden border">
                <MapContainer center={mapCenter} zoom={13} style={{ height: '100%', width: '100%' }}>
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; OpenStreetMap contributors'
                  />
                  <Marker position={mapCenter}>
                    <Popup>Service Center</Popup>
                  </Marker>
                </MapContainer>
              </div>
              <div className="mt-4 text-sm text-muted-foreground">
                <p className="font-semibold text-foreground mb-2">Your Service Area</p>
                <p>Currently serving New York City and surrounding areas</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
