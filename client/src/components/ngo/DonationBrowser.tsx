import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/shared/EmptyState';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Button } from '@/components/ui/button';
import { Package, MapPin, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import type { Donation } from '@shared/schema';
import { useToast } from '@/hooks/use-toast';
import { queryClient, apiRequest } from '@/lib/queryClient';

export function DonationBrowser() {
  const { toast } = useToast();
  
  const { data: donations, isLoading } = useQuery<Donation[]>({
    queryKey: ['/api/donations/available'],
  });

  const handleAccept = async (donationId: string) => {
    try {
      await apiRequest('POST', `/api/donations/${donationId}/accept`, {});
      
      queryClient.invalidateQueries({ queryKey: ['/api/donations/available'] });
      queryClient.invalidateQueries({ queryKey: ['/api/donations'] });
      
      toast({
        title: 'Donation accepted!',
        description: 'A volunteer will be assigned shortly.',
      });
    } catch (error) {
      toast({
        title: 'Failed to accept donation',
        description: error instanceof Error ? error.message : 'Please try again',
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return <LoadingSpinner message="Loading available donations..." />;
  }

  if (!donations || donations.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <EmptyState
            icon={Package}
            title="No available donations"
            description="Check back soon for new food donations in your area"
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Available Donations</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {donations.map((donation, index) => (
            <motion.div
              key={donation.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              data-testid={`donation-card-${donation.id}`}
            >
              <Card className="hover-elevate transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-1" data-testid="text-food-name">
                        {donation.foodDetails.name}
                      </h3>
                      <StatusBadge
                        status={donation.status}
                        urgency={donation.urgencyCategory || undefined}
                      />
                    </div>
                  </div>

                  <div className="space-y-2 text-sm text-muted-foreground mb-4">
                    <div className="flex items-center gap-2">
                      <Package className="w-4 h-4" />
                      <span>
                        {donation.foodDetails?.quantity} {donation.foodDetails?.unit} • {donation.foodDetails?.category}
                      </span>
                    </div>
                    {donation.location?.address && (
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        <span>
                          {donation.location.address.city}, {donation.location.address.state}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      <span>
                        Expires {formatDistanceToNow(new Date(donation.foodDetails?.expiryTime || new Date()), { addSuffix: true })}
                      </span>
                    </div>
                  </div>

                  {donation.foodDetails?.dietaryInfo && donation.foodDetails.dietaryInfo.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-4">
                      {donation.foodDetails.dietaryInfo.map((info) => (
                        <span
                          key={info}
                          className="text-xs px-2 py-1 bg-muted rounded-full"
                        >
                          {info}
                        </span>
                      ))}
                    </div>
                  )}

                  <Button
                    className="w-full"
                    onClick={() => handleAccept(donation.id)}
                    data-testid="button-accept"
                  >
                    Accept Donation
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
