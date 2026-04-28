import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { RefreshCw, Zap, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// 10 mock Petpooja POS items — units and categories match DonationUploadModal exactly
const MOCK_POS_ITEMS = [
  { name: 'Paneer Butter Masala', category: 'Cooked Meals', quantity: 8, unit: 'servings', dietary: ['Vegetarian'] },
  { name: 'Dal Tadka + Rice', category: 'Cooked Meals', quantity: 12, unit: 'servings', dietary: ['Vegetarian', 'Vegan'] },
  { name: 'Assorted Bread Rolls', category: 'Bakery', quantity: 30, unit: 'pieces', dietary: [] },
  { name: 'Mixed Vegetable Curry', category: 'Cooked Meals', quantity: 6, unit: 'kg', dietary: ['Vegetarian'] },
  { name: 'Fresh Fruit Salad', category: 'Fruits', quantity: 5, unit: 'kg', dietary: ['Vegetarian', 'Vegan'] },
  { name: 'Chicken Biryani', category: 'Cooked Meals', quantity: 15, unit: 'servings', dietary: [] },
  { name: 'Assorted Samosas', category: 'Cooked Meals', quantity: 50, unit: 'pieces', dietary: ['Vegetarian'] },
  { name: 'Gulab Jamun', category: 'Cooked Meals', quantity: 40, unit: 'pieces', dietary: ['Vegetarian'] },
  { name: 'Leftover Rotis', category: 'Bakery', quantity: 60, unit: 'pieces', dietary: ['Vegetarian', 'Dairy-free'] },
  { name: 'Pulao + Raita', category: 'Cooked Meals', quantity: 10, unit: 'servings', dietary: ['Vegetarian'] },
];

interface SyncedItem {
  name: string;
  category: string;
  quantity: number;
  unit: string;
}

export function POSSyncButton() {
  const { toast } = useToast();
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncedItems, setSyncedItems] = useState<SyncedItem[]>([]);
  const [showResult, setShowResult] = useState(false);

  const handleSync = async () => {
    setIsSyncing(true);
    setShowResult(false);
    setSyncedItems([]);

    try {
      // Pick 2-3 random items from the 10
      const shuffled = [...MOCK_POS_ITEMS].sort(() => Math.random() - 0.5);
      const count = Math.floor(Math.random() * 2) + 2; // 2 or 3
      const selected = shuffled.slice(0, count);

      // Create donations for each selected item
      for (const item of selected) {
        const expiryHours = Math.floor(Math.random() * 6) + 2; // 2-8 hrs
        await apiRequest('POST', '/api/donations', {
          source: 'petpooja_pos',
          pickupMode: 'ngo_pickup',
          foodDetails: {
            category: item.category,
            name: item.name,
            quantity: item.quantity,
            unit: item.unit,
            preparationTime: new Date().toISOString(),
            expiryTime: new Date(Date.now() + expiryHours * 3600000).toISOString(),
            dietaryInfo: item.dietary,
            specialInstructions: 'Auto-synced from Petpooja POS. NGO self-pickup required.',
            images: [],
          },
          location: {
            address: { street: '', city: '', state: '', pincode: '' },
            coordinates: [0, 0],
          },
        });
      }

      setSyncedItems(selected);
      setShowResult(true);
      queryClient.invalidateQueries({ queryKey: ['/api/donations'] });

      toast({
        title: `✅ POS Sync Complete`,
        description: `${count} surplus items listed from Petpooja. NGOs have been notified.`,
      });
    } catch (error) {
      toast({
        title: 'Sync Failed',
        description: error instanceof Error ? error.message : 'Could not sync from POS',
        variant: 'destructive',
      });
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="space-y-3">
      <Button
        onClick={handleSync}
        disabled={isSyncing}
        variant="outline"
        size="lg"
        className="border-green-500 text-green-700 hover:bg-green-50 gap-2"
        data-testid="button-pos-sync"
      >
        <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
        {isSyncing ? 'Syncing from Petpooja...' : 'Sync Surplus from POS'}
        <Badge variant="secondary" className="ml-1 bg-green-100 text-green-700 text-xs">
          Petpooja
        </Badge>
      </Button>

      <AnimatePresence>
        {showResult && syncedItems.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="rounded-lg border border-green-200 bg-green-50 p-3 space-y-2"
          >
            <div className="flex items-center gap-2 text-green-700 font-medium text-sm">
              <CheckCircle2 className="w-4 h-4" />
              {syncedItems.length} items listed from POS
            </div>
            <div className="space-y-1">
              {syncedItems.map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="flex items-center justify-between text-xs text-green-800 bg-white rounded px-2 py-1 border border-green-100"
                >
                  <span className="flex items-center gap-1">
                    <Zap className="w-3 h-3 text-green-500" />
                    {item.name}
                  </span>
                  <span className="text-muted-foreground">
                    {item.quantity} {item.unit}
                  </span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}