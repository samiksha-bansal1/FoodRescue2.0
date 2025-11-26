import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/shared/EmptyState';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { TaskLocationMap } from '@/components/volunteer/TaskLocationMap';
import { Button } from '@/components/ui/button';
import { Package, MapPin, Clock, Truck, Map, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/contexts/AuthContext';
import { CompletionBar } from '@/components/shared/CompletionBar';
import type { VolunteerTask, Donation } from '@shared/schema';
import { RatingModal } from '@/components/ngo/RatingModal';

export function TaskList() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);
  const [ratingModal, setRatingModal] = useState<{
    open: boolean;
    donationId?: string;
    donorId?: string;
    donorName?: string;
  }>({ open: false });
  
  const { data: tasks = [], isLoading: tasksLoading } = useQuery<VolunteerTask[]>({
    queryKey: ['/api/tasks'],
  });

  const { data: donations = [] } = useQuery<Donation[]>({
    queryKey: ['/api/donations'],
  });

  // Filter donations to show only those assigned to this volunteer
  const assignedDonations = donations.filter(
    d => (d.status === 'matched' || d.status === 'accepted' || d.status === 'in_transit') && 
          d.assignedVolunteerId === user?.id
  ) || [];

  // Use donations as primary source if available, fallback to tasks
  const availableTasks = assignedDonations.length > 0 ? assignedDonations : 
    tasks?.filter(t => t.status === 'assigned' || t.status === 'accepted') || [];
  
  const isLoading = tasksLoading || !donations;

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
    
    if (hoursLeft < 2) return 'Critical - < 2 hours';
    if (hoursLeft < 4) return 'High - < 4 hours';
    return 'Medium - 4+ hours';
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

  const handleMarkDelivered = async (taskId: string, donation: Donation | undefined) => {
    try {
      await apiRequest('POST', `/api/tasks/${taskId}/mark-delivered`, {});
      
      // Open rating modal
      if (donation) {
        const donor = (donation as any).donor;
        setRatingModal({
          open: true,
          donationId: donation.id,
          donorId: donation.donorId,
          donorName: donor?.fullName || 'Donor',
        });
      }

      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
      toast({
        title: 'Delivery Marked Complete!',
        description: 'Please rate the donor to help maintain quality standards.',
      });
    } catch (error) {
      toast({
        title: 'Failed to mark delivery',
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
    <>
      <Card>
        <CardHeader>
          <CardTitle>Your Assigned Tasks ({availableTasks.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4">
            {availableTasks.map((item, index) => {
              const isDonation = 'foodDetails' in item;
              const donation = isDonation ? item as Donation : donations.find(d => d.id === (item as VolunteerTask).donationId);
              const task = isDonation ? null : item as VolunteerTask;
              const urgencyLabel = donation ? getUrgencyLabel(donation.foodDetails.expiryTime) : '';
              const taskId = task?.id || donation?.id;
              const completionPercentage = donation?.completionPercentage || 0;
              const statusBadge = completionPercentage === 0 ? 'Assigned' : 
                                completionPercentage === 50 ? 'NGO Accepted' :
                                completionPercentage === 75 ? 'Volunteer Accepted' :
                                completionPercentage === 100 ? 'Delivered' : 'In Progress';

              return (
                <motion.div
                  key={taskId}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="hover-elevate">
                    <CardContent className="p-4">
                      <div className="mb-4 flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg mb-2">
                            {donation?.foodDetails.name || 'Delivery Task'} #{taskId?.slice(0, 8)}
                          </h3>
                          <div className="flex gap-2 flex-wrap mb-3">
                            <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                              {statusBadge}
                            </span>
                            <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium bg-orange-100 ${getUrgencyColor(donation?.foodDetails.expiryTime || '')}`}>
                              {urgencyLabel}
                            </span>
                          </div>
                          <div className="mb-3">
                            {donation && <CompletionBar percentage={completionPercentage} status={donation.status} />}
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
                              {donation?.location?.address ? `${donation.location.address.street}, ${donation.location.address.city}` : 'Location'}
                            </span>
                          </div>
                        </div>

                        <div>
                          <p className="text-xs text-muted-foreground mb-2">DELIVER TO</p>
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-green-600" />
                            <span className="text-sm font-medium">
                              {task?.deliveryLocation?.address ? task.deliveryLocation.address : 'NGO Location'}
                            </span>
                          </div>
                        </div>

                        {task && (
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
                        )}
                      </div>

                      {task && (
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
                      )}

                      {task && task.status === 'accepted' && (
                        <Button
                          onClick={() => handleMarkDelivered(task.id, donation)}
                          className="w-full bg-green-600 hover:bg-green-700"
                          data-testid="button-mark-delivered"
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Mark as Delivered
                        </Button>
                      )}

                      {task && expandedTaskId === task.id && (
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

      <RatingModal
        open={ratingModal.open}
        onOpenChange={(open) => setRatingModal({ ...ratingModal, open })}
        donationId={ratingModal.donationId || ''}
        donorId={ratingModal.donorId || ''}
        donorName={ratingModal.donorName || ''}
      />
    </>
  );
}
