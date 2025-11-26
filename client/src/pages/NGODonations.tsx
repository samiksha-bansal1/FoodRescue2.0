import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/shared/EmptyState';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Button } from '@/components/ui/button';
import { Package, MapPin, Star, CheckCircle, Truck } from 'lucide-react';
import { motion } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { useState } from 'react';
import type { Donation } from '@shared/schema';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { RatingModal } from '@/components/ngo/RatingModal';
import { CompletionBar } from '@/components/shared/CompletionBar';
import { apiRequest, queryClient } from '@/lib/queryClient';

export default function NGODonations() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [ratingModal, setRatingModal] = useState<{
    open: boolean;
    donationId?: string;
    donorId?: string;
    donorName?: string;
  }>({ open: false });

  const { data: allDonations, isLoading } = useQuery<Donation[]>({
    queryKey: ['/api/donations'],
  });

  const { data: allUsers = [] } = useQuery({
    queryKey: ['/api/admin/users'],
  });

  const donations = allDonations?.filter(
    d => d.matchedNGOId === user?.id && (d.status === 'accepted' || d.status === 'matched' || d.status === 'delivered')
  ) || [];

  const getDonor = (donorId: string) => {
    return allUsers.find((u: any) => u.id === donorId);
  };

  const acceptRideMutation = useMutation({
    mutationFn: async (donationId: string) => {
      return apiRequest('PATCH', `/api/donations/${donationId}/accept-ride`, {});
    },
    onSuccess: () => {
      toast({
        title: 'Ride accepted!',
        description: 'Volunteers will be notified about this pickup.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/donations'] });
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
    },
    onError: (error) => {
      toast({
        title: 'Failed to accept ride',
        description: error instanceof Error ? error.message : 'Please try again',
        variant: 'destructive',
      });
    },
  });

  const markDeliveredMutation = useMutation({
    mutationFn: async (donationId: string) => {
      return apiRequest('PATCH', `/api/donations/${donationId}/mark-delivered`, {});
    },
    onSuccess: () => {
      toast({
        title: 'Marked as delivered!',
        description: 'You can now rate this donor.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/donations'] });
    },
    onError: (error) => {
      toast({
        title: 'Failed to mark delivery',
        description: error instanceof Error ? error.message : 'Please try again',
        variant: 'destructive',
      });
    },
  });

  const handleRateDonor = (donation: Donation) => {
    const donor = getDonor(donation.donorId);
    setRatingModal({
      open: true,
      donationId: donation.id,
      donorId: donation.donorId,
      donorName: donor?.fullName || 'Donor',
    });
  };

  if (isLoading) {
    return <LoadingSpinner message="Loading your donations..." />;
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold mb-2">My Accepted Donations</h1>
        <p className="text-muted-foreground">Track all the donations you've accepted and provide feedback after delivery</p>
      </motion.div>

      {!donations || donations.length === 0 ? (
        <Card>
          <CardContent className="p-6">
            <EmptyState
              icon={Package}
              title="No accepted donations yet"
              description="Start accepting donations to help more people"
            />
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {donations.map((donation, index) => {
            const isDelivered = donation.status === 'delivered';
            const isMatched = donation.status === 'matched';
            const isAccepted = donation.status === 'accepted';
            const canRate = isDelivered && donation.completionPercentage === 100;
            const canAcceptRide = isMatched && donation.completionPercentage === 50;
            const canMarkDelivered = isAccepted && donation.completionPercentage === 75;

            return (
              <motion.div
                key={donation.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="hover-elevate transition-all duration-300">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg mb-2">
                          {donation.foodDetails?.name || 'Food Item'}
                        </h3>
                        <div className="flex gap-2 flex-wrap">
                          <StatusBadge status={donation.status} />
                          {isDelivered && (
                            <span className="inline-block px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium flex items-center gap-1">
                              <CheckCircle className="w-3 h-3" />
                              Delivered
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Left side - donation details */}
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                          <Package className="w-4 h-4 text-muted-foreground" />
                          <span>
                            <span className="font-medium">{donation.foodDetails?.quantity}</span> {donation.foodDetails?.unit}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">Category:</span>
                          <span className="font-medium capitalize">{donation.foodDetails?.category}</span>
                        </div>
                        {donation.location?.address && (
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-muted-foreground" />
                            <span>
                              {donation.location.address.city}, {donation.location.address.state}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Right side - progress and action */}
                      <div className="space-y-3">
                        <CompletionBar 
                          percentage={donation.completionPercentage || 0} 
                          status={donation.status}
                        />
                        {canAcceptRide && (
                          <Button
                            onClick={() => acceptRideMutation.mutate(donation.id)}
                            disabled={acceptRideMutation.isPending}
                            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                            data-testid="button-accept-ride"
                          >
                            {acceptRideMutation.isPending ? (
                              <LoadingSpinner size="sm" />
                            ) : (
                              <>
                                <Truck className="w-4 h-4 mr-2" />
                                Accept & Assign Pickup
                              </>
                            )}
                          </Button>
                        )}
                        {canMarkDelivered && (
                          <Button
                            onClick={() => markDeliveredMutation.mutate(donation.id)}
                            disabled={markDeliveredMutation.isPending}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                            data-testid="button-mark-delivered"
                          >
                            {markDeliveredMutation.isPending ? (
                              <LoadingSpinner size="sm" />
                            ) : (
                              <>
                                <CheckCircle className="w-4 h-4 mr-2" />
                                Mark Donation as Delivered
                              </>
                            )}
                          </Button>
                        )}
                        {canRate && (
                          <Button
                            onClick={() => handleRateDonor(donation)}
                            className="w-full bg-yellow-500 hover:bg-yellow-600 text-white"
                            data-testid="button-rate-donor"
                          >
                            <Star className="w-4 h-4 mr-2" />
                            Leave Feedback & Rate
                          </Button>
                        )}
                        {isDelivered && !canRate && (
                          <div className="text-center text-sm text-green-600 font-medium py-2">
                            <CheckCircle className="w-5 h-5 mx-auto mb-1" />
                            Already rated
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="pt-2 border-t">
                      <p className="text-xs text-muted-foreground">
                        Accepted {formatDistanceToNow(new Date(donation.updatedAt || donation.createdAt || new Date()), { addSuffix: true })}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Rating Modal */}
      <RatingModal
        open={ratingModal.open}
        onOpenChange={(open) => setRatingModal({ ...ratingModal, open })}
        donationId={ratingModal.donationId || ''}
        donorId={ratingModal.donorId || ''}
        donorName={ratingModal.donorName || ''}
      />
    </div>
  );
}
