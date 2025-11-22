import { Heart, Package, Users, TrendingUp, MapPin } from 'lucide-react';
import { StatsCard } from '@/components/shared/StatsCard';
import { DonationBrowser } from '@/components/ngo/DonationBrowser';
import { AcceptedDonations } from '@/components/ngo/AcceptedDonations';
import { LocationEditModal } from '@/components/shared/LocationEditModal';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import type { Donation } from '@shared/schema';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function NGODashboard() {
  const { user } = useAuth();
  const [showLocationModal, setShowLocationModal] = useState(false);

  const { data: allDonations = [] } = useQuery<Donation[]>({
    queryKey: ['/api/donations/available'],
  });

  const { data: myDonations = [] } = useQuery<Donation[]>({
    queryKey: ['/api/donations'],
  });

  const stats = useMemo(() => {
    const available = allDonations.filter(d => d.status === 'pending').length;
    const accepted = myDonations.filter(d => d.matchedNGOId === user?.id && (d.status === 'accepted' || d.status === 'matched' || d.status === 'delivered')).length;
    const totalMeals = myDonations
      .filter(d => d.matchedNGOId === user?.id)
      .reduce((sum, d) => sum + (d.foodDetails?.quantity || 0), 0);

    return {
      available,
      accepted,
      totalMeals,
      activeVolunteers: 0,
    };
  }, [allDonations, myDonations, user?.id]);

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
              Welcome, {user?.ngoProfile?.organizationName || user?.fullName}!
            </h1>
            <p className="text-muted-foreground">
              Browse and accept food donations in your area
            </p>
          </div>
          <Button onClick={() => setShowLocationModal(true)} variant="outline" data-testid="button-edit-location">
            <MapPin className="w-5 h-5 mr-2" />
            Edit Location
          </Button>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatsCard
          icon={Package}
          label="Available Donations"
          value={stats.available}
          delay={0}
        />
        <StatsCard
          icon={Heart}
          label="Accepted Donations"
          value={stats.accepted}
          delay={0.1}
        />
        <StatsCard
          icon={TrendingUp}
          label="Total Meals Received"
          value={stats.totalMeals}
          delay={0.2}
        />
        <StatsCard
          icon={Users}
          label="Active Volunteers"
          value={stats.activeVolunteers}
          delay={0.3}
        />
      </div>

      <Tabs defaultValue="browse" className="w-full">
        <TabsList className="grid w-full max-w-sm grid-cols-2">
          <TabsTrigger value="browse">Browse Donations</TabsTrigger>
          <TabsTrigger value="accepted">Accepted</TabsTrigger>
        </TabsList>

        <TabsContent value="browse" className="mt-6">
          <DonationBrowser />
        </TabsContent>

        <TabsContent value="accepted" className="mt-6">
          <AcceptedDonations />
        </TabsContent>
      </Tabs>

      <LocationEditModal
        open={showLocationModal}
        onOpenChange={setShowLocationModal}
        currentLocation={user?.ngoProfile?.address}
        userType="ngo"
      />
    </div>
  );
}
