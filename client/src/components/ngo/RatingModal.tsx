import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Star } from 'lucide-react';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { queryClient, apiRequest } from '@/lib/queryClient';

interface RatingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  donationId: string;
  donorId: string;
  donorName: string;
}

export function RatingModal({
  open,
  onOpenChange,
  donationId,
  donorId,
  donorName,
}: RatingModalProps) {
  const { toast } = useToast();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await apiRequest('POST', '/api/ratings', {
        donationId,
        donorId,
        rating,
        comment,
      });

      toast({
        title: 'Rating submitted!',
        description: `You rated ${donorName} with ${rating} stars.`,
      });

      queryClient.invalidateQueries({ queryKey: ['/api/ratings'] });
      queryClient.invalidateQueries({ queryKey: ['/api/donations'] });
      queryClient.invalidateQueries({ queryKey: ['/api/donations/available'] });
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });

      onOpenChange(false);
      setRating(5);
      setComment('');
    } catch (error) {
      toast({
        title: 'Failed to submit rating',
        description: error instanceof Error ? error.message : 'Please try again',
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
          <DialogTitle>Rate {donorName}</DialogTitle>
          <DialogDescription>
            Share your experience with this donor to help us maintain quality standards
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-3">
            <Label>Quality Rating</Label>
            <div className="flex gap-2 justify-center py-4">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className="focus:outline-none transition-transform hover:scale-110"
                  data-testid={`button-rate-${star}`}
                >
                  <Star
                    className={`w-8 h-8 ${
                      star <= rating
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-300'
                    }`}
                  />
                </button>
              ))}
            </div>
            <div className="text-center text-sm text-muted-foreground">
              {rating === 5 && 'Excellent!'}
              {rating === 4 && 'Very Good'}
              {rating === 3 && 'Good'}
              {rating === 2 && 'Fair'}
              {rating === 1 && 'Poor'}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="comment">Optional Comment</Label>
            <Textarea
              id="comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Share your experience... (max 300 characters)"
              maxLength={300}
              rows={3}
              data-testid="textarea-rating-comment"
            />
            <p className="text-xs text-muted-foreground">
              {comment.length}/300 characters
            </p>
          </div>

          <div className="flex gap-3 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
              data-testid="button-cancel-rating"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading} data-testid="button-submit-rating">
              {isLoading ? <LoadingSpinner size="sm" /> : 'Submit Rating'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
