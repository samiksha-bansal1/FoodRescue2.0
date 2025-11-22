import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, Clock, MapPin } from 'lucide-react';
import type { Donation } from '@shared/schema';

interface TimelineEvent {
  status: string;
  timestamp: string;
  label: string;
  icon: any;
  color: string;
}

export function DonationTimeline({ donation }: { donation: Donation }) {
  const events: TimelineEvent[] = [
    {
      status: 'pending',
      label: 'Donation Created',
      icon: MapPin,
      color: 'bg-blue-500',
      timestamp: donation.createdAt?.toString() || new Date().toISOString(),
    },
    {
      status: 'accepted',
      label: 'Accepted by NGO',
      icon: CheckCircle,
      color: 'bg-green-500',
      timestamp: donation.timeline?.find(t => t.status === 'accepted')?.timestamp || '',
    },
    {
      status: 'matched',
      label: 'Volunteer Assigned',
      icon: Clock,
      color: 'bg-purple-500',
      timestamp: donation.timeline?.find(t => t.status === 'matched')?.timestamp || '',
    },
    {
      status: 'delivered',
      label: 'Delivered',
      icon: CheckCircle,
      color: 'bg-emerald-500',
      timestamp: donation.timeline?.find(t => t.status === 'delivered')?.timestamp || '',
    },
  ];

  const getProgressPercentage = () => {
    const statuses = ['pending', 'accepted', 'matched', 'delivered'];
    const currentIndex = statuses.indexOf(donation.status);
    return ((currentIndex + 1) / statuses.length) * 100;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Donation Journey</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {events.map((event, index) => {
            const isCompleted = events.slice(0, index + 1).every(e => 
              donation.timeline?.some(t => t.status === e.status) || e.status === donation.status
            );
            const isCurrent = event.status === donation.status;

            return (
              <div key={event.status} className="relative">
                <div className="flex items-start gap-4">
                  <div className={`rounded-full p-2 ${isCompleted || isCurrent ? event.color : 'bg-gray-300'} text-white flex-shrink-0`}>
                    <event.icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-sm">{event.label}</p>
                    {event.timestamp && (
                      <p className="text-xs text-muted-foreground">
                        {new Date(event.timestamp).toLocaleDateString()} {new Date(event.timestamp).toLocaleTimeString()}
                      </p>
                    )}
                  </div>
                </div>
                {index < events.length - 1 && (
                  <div className={`ml-6 h-8 border-l-2 ${isCompleted ? 'border-emerald-500' : 'border-gray-300'}`} />
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-6 bg-muted rounded-lg p-3">
          <p className="text-xs text-muted-foreground mb-2">Overall Progress</p>
          <div className="w-full bg-gray-300 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-blue-500 to-emerald-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${getProgressPercentage()}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-2">{Math.round(getProgressPercentage())}% Complete</p>
        </div>
      </CardContent>
    </Card>
  );
}
