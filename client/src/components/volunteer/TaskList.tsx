import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/shared/EmptyState';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { TaskLocationMap } from '@/components/volunteer/TaskLocationMap';
import { Button } from '@/components/ui/button';
import { Package, MapPin, Clock, Truck, AlertCircle, Map } from 'lucide-react';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { queryClient, apiRequest } from '@/lib/queryClient';
import type { VolunteerTask, Donation } from '@shared/schema';

export function TaskList() {
  const { toast } = useToast();
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);
  
  const { data: tasks, isLoading } = useQuery<VolunteerTask[]>({
    queryKey: ['/api/tasks'],
  });

  const { data: donations = [] } = useQuery<Donation[]>({
    queryKey: ['/api/donations'],
  });

  const availableTasks = tasks?.filter(t => t.status === 'assigned') || [];

  const getUrgencyColor = (expiryTime: string) => {
    const now = new Date();
    const expiry = new Date(expiryTime);
    const hoursLeft = (expiry.getTime() - now.getTime()) / (1000 * 60 * 60);
    
    if (hoursLeft < 2) return 'text-red-600';
    if (hoursLeft < 4) return 'text-orange-600';
    return 'text-yellow-600';
  };

  const getUrgencyLabel = (expiryTime: string) => {
    const now = new Date();
    const expiry = new Date(expiryTime);
    const hoursLeft = (expiry.getTime() - now.getTime()) / (1000 * 60 * 60);
    
    if (hoursLeft < 2) return '🔴 Critical - < 2 hours';
    if (hoursLeft < 4) return '🟠 High - < 4 hours';
    return '🟡 Medium - 4+ hours';
  };

  const handleAcceptTask = async (taskId: string) => {
    try {
      await apiRequest('POST', `/api/tasks/${taskId}/accept`, {});
      
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
      
      toast({
        title: 'Task Accepted!',
        description: 'You have accepted the delivery task. Please proceed with pickup.',
      });
    } catch (error) {
      toast({
        title: 'Failed to accept task',
        description: error instanceof Error ? error.message : 'Please try again',
        variant: 'destructive',
      });
    }
  };

  const handleRejectTask = async (taskId: string) => {
    try {
      await apiRequest('POST', `/api/tasks/${taskId}/reject`, {});
      
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
      
      toast({
        title: 'Task Rejected',
        description: 'The task has been reassigned.',
      });
    } catch (error) {
      toast({
        title: 'Failed to reject task',
        description: error instanceof Error ? error.message : 'Please try again',
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return <LoadingSpinner message="Loading available tasks..." />;
  }

  if (!availableTasks || availableTasks.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <EmptyState
            icon={Truck}
            title="No tasks available"
            description="Check back soon for delivery tasks. New tasks appear when NGOs accept donations."
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Available Delivery Tasks ({availableTasks.length})</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-4">
          {availableTasks.map((task, index) => {
            const donation = donations.find(d => d.id === task.donationId);
            const urgencyLabel = donation ? getUrgencyLabel(donation.foodDetails.expiryTime) : 'N/A';
            
            return (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="hover-elevate transition-all duration-300">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg mb-2">
                          {donation?.foodDetails.name || 'Delivery Task'} #{task.id?.slice(0, 8)}
                        </h3>
                        <div className="flex gap-2 flex-wrap">
                          <span className="inline-block px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">
                            Assigned
                          </span>
                          <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium bg-orange-100 ${getUrgencyColor(donation?.foodDetails.expiryTime || '')}`}>
                            {urgencyLabel}
                          </span>
                        </div>
                      </div>
                    </div>

                    {donation && (
                      <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                        <p className="text-xs text-blue-900 font-medium">Food Details</p>
                        <p className="text-sm mt-1">{donation.foodDetails.category} • {donation.foodDetails.quantity} {donation.foodDetails.unit}</p>
                        {donation.foodDetails.specialInstructions && (
                          <p className="text-xs text-blue-800 mt-1">Note: {donation.foodDetails.specialInstructions}</p>
                        )}
                      </div>
                    )}

                    <div className="space-y-3 mb-4">
                      <div>
                        <p className="text-xs text-muted-foreground mb-2">PICKUP FROM</p>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-primary" />
                          <span className="text-sm font-medium">
                            {typeof task.pickupLocation === 'object' && task.pickupLocation?.address ? task.pickupLocation.address : 'Location'}
                          </span>
                        </div>
                      </div>

                      <div>
                        <p className="text-xs text-muted-foreground mb-2">DELIVER TO</p>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-green-600" />
                          <span className="text-sm font-medium">
                            {typeof task.deliveryLocation === 'object' && task.deliveryLocation?.address ? task.deliveryLocation.address : 'NGO Location'}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                        <div>
                          <p className="text-xs text-muted-foreground">Distance</p>
                          <p className="font-semibold">{task.distance || 'N/A'} km</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Est. Delivery Time</p>
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            <p className="font-semibold">{task.estimatedTime || 0} min</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2 mb-4">
                      <Button
                        onClick={() => handleAcceptTask(task.id)}
                        className="flex-1"
                        data-testid="button-accept-task"
                      >
                        Accept Task
                      </Button>
                      <Button
                        onClick={() => handleRejectTask(task.id)}
                        variant="outline"
                        className="flex-1"
                        data-testid="button-reject-task"
                      >
                        Reject
                      </Button>
                      <Button
                        onClick={() => setExpandedTaskId(expandedTaskId === task.id ? null : task.id)}
                        variant="outline"
                        size="icon"
                        data-testid="button-view-map"
                        title="View route map"
                      >
                        <Map className="w-4 h-4" />
                      </Button>
                    </div>

                    {expandedTaskId === task.id && (
                      <div className="mt-4 pt-4 border-t">
                        <TaskLocationMap task={task} />
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
