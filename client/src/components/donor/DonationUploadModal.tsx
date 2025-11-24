import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { useAuth } from '@/contexts/AuthContext';
import { foodCategories } from '@shared/schema';
import { queryClient } from '@/lib/queryClient';
import { AlertCircle, Zap } from 'lucide-react';

interface DonationUploadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DonationUploadModal({ open, onOpenChange }: DonationUploadModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    category: '',
    name: '',
    quantity: '',
    unit: 'kg',
    preparationTime: '',
    expiryTime: '',
    specialInstructions: '',
    dietaryInfo: [] as string[],
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const res = await fetch('/api/donations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          donorId: user?.id,
          foodDetails: {
            category: formData.category,
            name: formData.name,
            quantity: parseFloat(formData.quantity),
            unit: formData.unit,
            preparationTime: formData.preparationTime,
            expiryTime: formData.expiryTime,
            dietaryInfo: formData.dietaryInfo,
            specialInstructions: formData.specialInstructions,
            images: [],
          },
          location: user?.donorProfile?.address || {
            address: { street: '', city: '', state: '', pincode: '' },
            coordinates: [0, 0],
          },
          status: 'pending',
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to upload donation');
      }

      toast({
        title: 'Donation uploaded!',
        description: 'Your donation has been listed and will be matched with NGOs shortly.',
      });

      queryClient.invalidateQueries({ queryKey: ['/api/donations'] });
      queryClient.invalidateQueries({ queryKey: ['/api/donations/available'] });

      onOpenChange(false);
      setFormData({
        category: '',
        name: '',
        quantity: '',
        unit: 'kg',
        preparationTime: '',
        expiryTime: '',
        specialInstructions: '',
        dietaryInfo: [],
      });
    } catch (error) {
      toast({
        title: 'Upload failed',
        description: error instanceof Error ? error.message : 'Please try again',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const dietaryOptions = ['Vegetarian', 'Vegan', 'Contains Nuts', 'Gluten-free', 'Dairy-free'];

  // Calculate urgency score
  const calculateUrgency = (expiryTime: string) => {
    if (!expiryTime) return null;
    const now = new Date();
    const expiry = new Date(expiryTime);
    const hoursLeft = (expiry.getTime() - now.getTime()) / (1000 * 60 * 60);
    
    if (hoursLeft < 4) return { level: 'high', label: 'HIGH URGENCY - Critical', color: 'bg-red-500', icon: AlertCircle };
    if (hoursLeft < 12) return { level: 'medium', label: 'MEDIUM URGENCY', color: 'bg-yellow-500', icon: Zap };
    return { level: 'low', label: 'Low Urgency', color: 'bg-green-500', icon: Zap };
  };

  const urgency = calculateUrgency(formData.expiryTime);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Upload Food Donation</DialogTitle>
          <DialogDescription>
            Provide details about the food you want to donate
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Food Category</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value })}
                required
              >
                <SelectTrigger data-testid="select-category">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {foodCategories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Food Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                data-testid="input-food-name"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity</Label>
              <Input
                id="quantity"
                type="number"
                step="0.01"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                required
                data-testid="input-quantity"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="unit">Unit</Label>
              <Select
                value={formData.unit}
                onValueChange={(value) => setFormData({ ...formData, unit: value })}
              >
                <SelectTrigger data-testid="select-unit">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="kg">Kilograms</SelectItem>
                  <SelectItem value="pieces">Pieces</SelectItem>
                  <SelectItem value="servings">Servings</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="preparationTime">Preparation Time</Label>
              <Input
                id="preparationTime"
                type="datetime-local"
                value={formData.preparationTime}
                onChange={(e) => setFormData({ ...formData, preparationTime: e.target.value })}
                required
                data-testid="input-prep-time"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="expiryTime">Expiry Time</Label>
              <Input
                id="expiryTime"
                type="datetime-local"
                value={formData.expiryTime}
                onChange={(e) => setFormData({ ...formData, expiryTime: e.target.value })}
                required
                data-testid="input-expiry-time"
              />
              {urgency && (
                <div className="flex items-center gap-2 mt-2">
                  <Badge className={`${urgency.color} text-white`} data-testid="badge-urgency">
                    {urgency.label}
                  </Badge>
                  {urgency.level === 'high' && (
                    <span className="text-xs text-red-600 font-medium">NGOs prioritize high-urgency donations</span>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Dietary Information</Label>
            <div className="grid grid-cols-2 gap-4">
              {dietaryOptions.map((option) => (
                <div key={option} className="flex items-center space-x-2">
                  <Checkbox
                    id={option}
                    checked={formData.dietaryInfo.includes(option)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setFormData({
                          ...formData,
                          dietaryInfo: [...formData.dietaryInfo, option],
                        });
                      } else {
                        setFormData({
                          ...formData,
                          dietaryInfo: formData.dietaryInfo.filter((item) => item !== option),
                        });
                      }
                    }}
                    data-testid={`checkbox-${option.toLowerCase().replace(/\s+/g, '-')}`}
                  />
                  <Label htmlFor={option} className="cursor-pointer">
                    {option}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="specialInstructions">Special Instructions (Optional)</Label>
            <Textarea
              id="specialInstructions"
              value={formData.specialInstructions}
              onChange={(e) => setFormData({ ...formData, specialInstructions: e.target.value })}
              placeholder="Any special handling or storage requirements..."
              rows={3}
              maxLength={500}
              data-testid="textarea-instructions"
            />
            <p className="text-xs text-muted-foreground">
              {formData.specialInstructions.length}/500 characters
            </p>
          </div>

          <div className="flex gap-3 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
              data-testid="button-cancel"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading} data-testid="button-submit">
              {isLoading ? <LoadingSpinner size="sm" /> : 'Upload Donation'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
