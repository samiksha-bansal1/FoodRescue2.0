import { Star, Award, Package, CheckCircle, MessageCircle } from 'lucide-react';
import { motion } from 'framer-motion';

interface DonorRatingDisplayProps {
  donor: any;
}

export function DonorRatingDisplay({ donor }: DonorRatingDisplayProps) {
  const rating = donor?.donorProfile?.rating || 0;
  const totalRatings = donor?.donorProfile?.totalRatings || 0;
  const isNewDonor = totalRatings === 0;
  const ratingBreakdown = donor?.donorProfile?.ratingBreakdown || {
    foodQuality: 0,
    packaging: 0,
    accuracy: 0,
    communication: 0,
  };

  const ratingPercentage = isNewDonor ? 0 : (rating / 10) * 100;

  const getStarColor = (rating: number) => {
    if (isNewDonor) return 'text-blue-600 dark:text-blue-400';
    if (rating >= 8) return 'text-emerald-600 dark:text-emerald-400';
    if (rating >= 6) return 'text-yellow-600 dark:text-yellow-400';
    if (rating >= 4) return 'text-orange-600 dark:text-orange-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getQualityText = (rating: number) => {
    if (isNewDonor) return 'New Donor';
    if (rating >= 8) return 'Excellent';
    if (rating >= 6) return 'Good';
    if (rating >= 4) return 'Average';
    return 'Needs Improvement';
  };

  return (
    <div className="bg-card border border-border rounded-lg p-4">
      <div className="flex items-center gap-4 mb-4">
        <div className="text-center">
          <div className={`text-4xl font-bold ${getStarColor(rating)}`}>
            {isNewDonor ? 'NEW' : rating.toFixed(1)}
          </div>
          <div className="flex items-center justify-center mt-2">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`w-4 h-4 ${
                  isNewDonor ? 'text-blue-300' : (i < Math.round(rating / 2) ? getStarColor(rating) : 'text-muted-foreground')
                } ${isNewDonor || i < Math.round(rating / 2) ? 'fill-current' : ''}`}
              />
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {isNewDonor ? 'New to platform' : `${totalRatings} ${totalRatings === 1 ? 'rating' : 'ratings'}`}
          </p>
        </div>

        <div className="flex-1">
          <div className="h-3 bg-muted rounded-full overflow-hidden">
            <motion.div
              className={`h-full ${
                rating >= 8 ? 'bg-emerald-600' :
                rating >= 6 ? 'bg-yellow-600' :
                rating >= 4 ? 'bg-orange-600' :
                'bg-red-600'
              }`}
              initial={{ width: 0 }}
              animate={{ width: `${ratingPercentage}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {getQualityText(rating)}
          </p>
        </div>
      </div>

      {totalRatings > 0 && (
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center gap-2 text-sm">
            <Package className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground">Food Quality</p>
              <p className="text-sm font-semibold">{ratingBreakdown.foodQuality.toFixed(1)}/10</p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm">
            <Award className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground">Packaging</p>
              <p className="text-sm font-semibold">{ratingBreakdown.packaging.toFixed(1)}/10</p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm">
            <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground">Accuracy</p>
              <p className="text-sm font-semibold">{ratingBreakdown.accuracy.toFixed(1)}/10</p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm">
            <MessageCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground">Communication</p>
              <p className="text-sm font-semibold">{ratingBreakdown.communication.toFixed(1)}/10</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
