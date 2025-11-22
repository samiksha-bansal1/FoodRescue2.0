import { useAuth } from '@/contexts/AuthContext';
import { Package, TrendingUp, Scale, Award, Plus, MapPin } from 'lucide-react';
import { StatsCard } from '@/components/shared/StatsCard';
import { Button } from '@/components/ui/button';
import { useState, useMemo } from 'react';
import { DonationUploadModal } from '@/components/donor/DonationUploadModal';
import { DonationList } from '@/components/donor/DonationList';
import { LocationEditModal } from '@/components/shared/LocationEditModal';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import type { Donation } from '@shared/schema';

export default function DonorDashboard() {
  const { user } = useAuth();
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);

  const { data: donations = [] } = useQuery<Donation[]>({
    queryKey: ['/api/donations'],
  });

  const stats = useMemo(() => {
    const totalDonations = donations.length;
    const acceptedDonations = donations.filter(d => d.status === 'accepted' || d.status === 'matched').length;
    const totalQuantity = donations.reduce((sum, d) => sum + (d.foodDetails?.quantity || 0), 0);
    const impactScore = acceptedDonations * 10 + totalDonations * 5;

    return {
      totalDonations,
      mealsProvided: acceptedDonations,
      foodSaved: totalQuantity,
      impactScore,
    };
  }, [donations]);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-2" data-testid="text-welcome">
              Welcome back, {user?.donorProfile?.businessName || user?.fullName}!
            </h1>
            <p className="text-muted-foreground">
              Track your donations and see your impact
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setShowLocationModal(true)} variant="outline" data-testid="button-edit-location">
              <MapPin className="w-5 h-5 mr-2" />
              Edit Location
            </Button>
            <Button onClick={() => setShowUploadModal(true)} size="lg" data-testid="button-upload-donation">
              <Plus className="w-5 h-5 mr-2" />
              Create Donation
            </Button>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatsCard
          icon={Package}
          label="Total Donations"
          value={stats.totalDonations}
          delay={0}
        />
        <StatsCard
          icon={TrendingUp}
          label="Accepted"
          value={stats.mealsProvided}
          delay={0.1}
        />
        <StatsCard
          icon={Scale}
          label="Food Saved (kg)"
          value={stats.foodSaved}
          suffix=" kg"
          delay={0.2}
        />
        <StatsCard
          icon={Award}
          label="Impact Score"
          value={stats.impactScore}
          delay={0.3}
        />
      </div>

      <DonationList />

      <DonationUploadModal
        open={showUploadModal}
        onOpenChange={setShowUploadModal}
      />

      <LocationEditModal
        open={showLocationModal}
        onOpenChange={setShowLocationModal}
        currentLocation={user?.donorProfile?.address}
        userType="donor"
      />
    </div>
  );
}
