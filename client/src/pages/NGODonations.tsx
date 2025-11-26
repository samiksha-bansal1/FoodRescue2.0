import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { EmptyState } from '@/components/shared/EmptyState';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { Button } from '@/components/ui/button';
import { Package, MapPin, Star, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';
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

  const pendingDonations = donations.filter(d => d.status === 'matched' || d.status === 'accepted');
  const deliveredDonations = donations.filter(d => d.status === 'delivered');

  const getDonor = (donorId: string) => {
    return allUsers.find((u: any) => u.id === donorId);
  };

  const markDeliveredMutation = useMutation({
    mutationFn: async (donationId: string) => {
      return apiRequest('PATCH', `/api/donations/${donationId}/mark-delivered`, {});
    },
    onSuccess: () => {
      toast({
        title: 'Marked as delivered!',
        description: 'You can now leave feedback for this donor.',
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
        <h1 className="text-3xl font-bold mb-2">My Donations</h1>
        <p className="text-muted-foreground">Mark donations as delivered and leave feedback</p>
      </motion.div>

      <div className="space-y-8">
        {/* Pending Deliveries Section */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Pending Deliveries</h2>
          {!pendingDonations || pendingDonations.length === 0 ? (
            <Card>
              <CardContent className="p-6">
                <EmptyState
                  icon={Package}
                  title="No pending deliveries"
                  description="All donations have been delivered"
                />
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {pendingDonations.map((donation, index) => (
                <motion.div
                  key={donation.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className="hover-elevate transition-all duration-300">
                    <CardHeader>
                      <h3 className="font-semibold text-lg">
                        {donation.foodDetails?.name || 'Food Item'}
                      </h3>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Package className="w-4 h-4 text-muted-foreground" />
                            <span>
                              <span className="font-medium">{donation.foodDetails?.quantity}</span> {donation.foodDetails?.unit}
                            </span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Category:</span>{' '}
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
                        <div>
                          <CompletionBar percentage={donation.completionPercentage || 0} status={donation.status} />
                        </div>
                      </div>
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
                            Mark as Delivered
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Leave Feedback Section */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Leave Feedback</h2>
          {!deliveredDonations || deliveredDonations.length === 0 ? (
            <Card>
              <CardContent className="p-6">
                <EmptyState
                  icon={Package}
                  title="No delivered donations"
                  description="Once donations are delivered, you can leave feedback here"
                />
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {deliveredDonations.map((donation, index) => (
                <motion.div
                  key={donation.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className="hover-elevate transition-all duration-300">
                    <CardHeader>
                      <h3 className="font-semibold text-lg">
                        {donation.foodDetails?.name || 'Food Item'}
                      </h3>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Package className="w-4 h-4 text-muted-foreground" />
                            <span>
                              <span className="font-medium">{donation.foodDetails?.quantity}</span> {donation.foodDetails?.unit}
                            </span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Category:</span>{' '}
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
                        <div>
                          <CompletionBar percentage={100} status="delivered" />
                        </div>
                      </div>
                      <Button
                        onClick={() => handleRateDonor(donation)}
                        className="w-full bg-yellow-500 hover:bg-yellow-600 text-white"
                        data-testid="button-rate-donor"
                      >
                        <Star className="w-4 h-4 mr-2" />
                        Leave Feedback & Rate
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

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
