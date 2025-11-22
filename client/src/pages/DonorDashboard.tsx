import { useAuth } from '@/contexts/AuthContext';
import { Package, TrendingUp, Scale, Award, Plus, MapPin, Navigation } from 'lucide-react';
import { StatsCard } from '@/components/shared/StatsCard';
import { Button } from '@/components/ui/button';
import { useState, useMemo } from 'react';
import { DonationUploadModal } from '@/components/donor/DonationUploadModal';
import { DonationList } from '@/components/donor/DonationList';
import { LocationEditModal } from '@/components/shared/LocationEditModal';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { queryClient, apiRequest } from '@/lib/queryClient';
import type { Donation } from '@shared/schema';

export default function DonorDashboard() {
  const { user, setUser } = useAuth();
  const { toast } = useToast();
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  const { data: donations = [] } = useQuery<Donation[]>({
    queryKey: ['/api/donations'],
  });

  const handleUseCurrentLocation = async () => {
    setIsGettingLocation(true);
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
        });
      });

      const { latitude, longitude } = position.coords;
      
      // Get address from coordinates using reverse geocoding
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
      );
      const data = await response.json();
      
      const updatedProfile = {
        ...user?.donorProfile,
        address: {
          street: data.address?.road || data.address?.building || 'Current Location',
          city: data.address?.city || data.address?.town || 'Unknown',
          state: data.address?.state || '',
          pincode: data.address?.postcode || '',
          coordinates: [longitude, latitude],
        },
      };

      const result = await apiRequest('PATCH', '/api/auth/profile', {
        donorProfile: updatedProfile,
      });

      setUser(result);
      toast({
        title: 'Location Updated',
        description: `Your location has been set to ${data.address?.city || 'the selected area'}.`,
      });
    } catch (error) {
      toast({
        title: 'Location Error',
        description: error instanceof Error ? error.message : 'Could not get your location',
        variant: 'destructive',
      });
    } finally {
      setIsGettingLocation(false);
    }
  };

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
            <Button 
              onClick={handleUseCurrentLocation} 
              variant="outline" 
              data-testid="button-use-current-location"
              disabled={isGettingLocation}
            >
              <Navigation className="w-5 h-5 mr-2" />
              {isGettingLocation ? 'Getting Location...' : 'Use Current Location'}
            </Button>
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
