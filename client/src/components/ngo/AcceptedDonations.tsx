import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/shared/EmptyState';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { DonationTimeline } from '@/components/shared/DonationTimeline';
import { Package, MapPin } from 'lucide-react';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import type { Donation } from '@shared/schema';

export function AcceptedDonations() {
  const [expandedDonationId, setExpandedDonationId] = useState<string | null>(null);
  
  const { data: allDonations, isLoading } = useQuery<Donation[]>({
    queryKey: ['/api/donations'],
  });

  const donations = allDonations?.filter(d => d.status === 'accepted' || d.status === 'matched' || d.status === 'delivered') || [];

  if (isLoading) {
    return <LoadingSpinner message="Loading accepted donations..." />;
  }

  if (!donations || donations.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <EmptyState
            icon={Package}
            title="No accepted donations yet"
            description="Start accepting donations to grow your impact"
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Accepted Donations</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {donations.map((donation, index) => (
            <motion.div
              key={donation.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              data-testid={`accepted-donation-${donation.id}`}
            >
              <Card className="hover-elevate transition-all duration-300">
                <CardContent className="p-4">
                  <div 
                    className="cursor-pointer"
                    onClick={() => setExpandedDonationId(expandedDonationId === donation.id ? null : donation.id)}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="font-semibold" data-testid="text-food-name">
                          {donation.foodDetails?.name || 'Food Item'}
                        </h3>
                        <StatusBadge status={donation.status} />
                      </div>
                    </div>

                    <div className="space-y-2 text-sm text-muted-foreground mb-3">
                      <div className="flex items-center gap-2">
                        <Package className="w-4 h-4" />
                        <span>
                          {donation.foodDetails?.quantity || 0} {donation.foodDetails?.unit || 'units'}
                        </span>
                      </div>
                      {donation.location?.address && (
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4" />
                          <span>
                            {donation.location.address.city}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="text-xs text-muted-foreground">
                      Accepted {formatDistanceToNow(new Date(donation.updatedAt || donation.createdAt || new Date()), { addSuffix: true })}
                    </div>
                  </div>
                  
                  {expandedDonationId === donation.id && (
                    <div className="mt-4 pt-4 border-t">
                      <DonationTimeline donation={donation} />
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
