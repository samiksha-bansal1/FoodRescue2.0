import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/shared/EmptyState';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { DonationTimeline } from '@/components/shared/DonationTimeline';
import { Package } from 'lucide-react';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import type { Donation } from '@shared/schema';
import { useAuth } from '@/contexts/AuthContext';

export function DonationList() {
  const { user } = useAuth();
  const [expandedDonationId, setExpandedDonationId] = useState<string | null>(null);
  
  const { data: donations, isLoading } = useQuery<Donation[]>({
    queryKey: ['/api/donations', user?.id],
  });

  if (isLoading) {
    return <LoadingSpinner message="Loading donations..." />;
  }

  if (!donations || donations.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <EmptyState
            icon={Package}
            title="No donations yet"
            description="Start making an impact by uploading your first food donation"
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>My Donations</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
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
                  <div 
                    className="cursor-pointer"
                    onClick={() => setExpandedDonationId(expandedDonationId === donation.id ? null : donation.id)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-lg" data-testid="text-food-name">
                            {donation.foodDetails.name}
                          </h3>
                          <StatusBadge
                            status={donation.status}
                            urgency={donation.urgencyCategory || undefined}
                          />
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-muted-foreground">
                          <div>
                            <span className="font-medium">Category:</span>{' '}
                            {donation.foodDetails?.category || 'N/A'}
                          </div>
                          <div>
                            <span className="font-medium">Quantity:</span>{' '}
                            {donation.foodDetails?.quantity || 0} {donation.foodDetails?.unit || 'N/A'}
                          </div>
                          <div>
                            <span className="font-medium">ID:</span> {donation.donationId}
                          </div>
                          <div>
                            <span className="font-medium">Posted:</span>{' '}
                            {formatDistanceToNow(new Date(donation.createdAt || Date.now()), {
                              addSuffix: true,
                            })}
                          </div>
                        </div>
                      </div>
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
