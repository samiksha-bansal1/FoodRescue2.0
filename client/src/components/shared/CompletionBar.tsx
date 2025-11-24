import { motion } from 'framer-motion';

interface CompletionBarProps {
  percentage: number;
  status: string;
}

export function CompletionBar({ percentage, status }: CompletionBarProps) {
  const getStatusLabel = (percent: number, stat: string) => {
    if (percent === 0) return 'Pending';
    if (percent === 50) return 'NGO Accepted - Awaiting Volunteer';
    if (percent === 75) return 'Volunteer Accepted';
    if (percent === 100) return 'Delivered';
    return stat;
  };

  const getBarColor = (percent: number) => {
    if (percent === 0) return 'bg-gray-300';
    if (percent <= 50) return 'bg-yellow-500';
    if (percent < 100) return 'bg-blue-500';
    return 'bg-green-600';
  };

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium">{getStatusLabel(percentage, status)}</span>
        <span className="text-sm font-bold text-primary">{percentage}%</span>
      </div>
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
        <motion.div
          className={`h-full ${getBarColor(percentage)}`}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
}
