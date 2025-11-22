import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { MapPin } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { apiRequest, queryClient } from '@/lib/queryClient';

interface LocationEditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentLocation?: {
    street: string;
    city: string;
    state: string;
    pincode: string;
    coordinates: [number, number];
  };
  userType: 'donor' | 'ngo';
}

export function LocationEditModal({ open, onOpenChange, currentLocation, userType }: LocationEditModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    street: currentLocation?.street || '',
    city: currentLocation?.city || '',
    state: currentLocation?.state || '',
    pincode: currentLocation?.pincode || '',
    latitude: currentLocation?.coordinates[0] || 40.7128,
    longitude: currentLocation?.coordinates[1] || -74.0060,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const profileKey = userType === 'donor' ? 'donorProfile' : 'ngoProfile';
      const updateData = {
        [profileKey]: {
          ...(userType === 'donor' 
            ? {
                businessName: user?.donorProfile?.businessName,
                businessType: user?.donorProfile?.businessType,
              }
            : {
                organizationName: user?.ngoProfile?.organizationName,
                registrationNumber: user?.ngoProfile?.registrationNumber,
                capacity: user?.ngoProfile?.capacity,
                acceptedCategories: user?.ngoProfile?.acceptedCategories,
              }
          ),
          address: {
            street: formData.street,
            city: formData.city,
            state: formData.state,
            pincode: formData.pincode,
          },
          coordinates: [formData.latitude, formData.longitude],
        },
      };

      await apiRequest('PATCH', '/api/auth/profile', updateData);

      queryClient.invalidateQueries({ queryKey: ['/api/donations'] });

      toast({
        title: 'Location Updated',
        description: 'Your address has been updated successfully.',
      });

      onOpenChange(false);
    } catch (error) {
      toast({
        title: 'Update Failed',
        description: error instanceof Error ? error.message : 'Failed to update location',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Update Location
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="street">Street Address</Label>
            <Input
              id="street"
              value={formData.street}
              onChange={(e) => setFormData({ ...formData, street: e.target.value })}
              placeholder="123 Main Street"
              required
              data-testid="input-street"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                placeholder="New York"
                required
                data-testid="input-city"
              />
            </div>
            <div>
              <Label htmlFor="state">State</Label>
              <Input
                id="state"
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                placeholder="NY"
                required
                data-testid="input-state"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="pincode">Pincode</Label>
            <Input
              id="pincode"
              value={formData.pincode}
              onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
              placeholder="10001"
              required
              data-testid="input-pincode"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="latitude">Latitude</Label>
              <Input
                id="latitude"
                type="number"
                step="0.0001"
                value={formData.latitude}
                onChange={(e) => setFormData({ ...formData, latitude: parseFloat(e.target.value) })}
                data-testid="input-latitude"
              />
            </div>
            <div>
              <Label htmlFor="longitude">Longitude</Label>
              <Input
                id="longitude"
                type="number"
                step="0.0001"
                value={formData.longitude}
                onChange={(e) => setFormData({ ...formData, longitude: parseFloat(e.target.value) })}
                data-testid="input-longitude"
              />
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
              data-testid="button-cancel"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="flex-1"
              data-testid="button-save-location"
            >
              {isLoading ? 'Saving...' : 'Save Location'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
