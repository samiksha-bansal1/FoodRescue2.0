import { Bell, CheckCircle, Package, User, MapPin, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useNotifications } from '@/contexts/NotificationContext';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useEffect, useState } from 'react';

const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'donation_accepted':
    case 'new_donation':
      return <Package className="w-4 h-4 text-emerald-600" />;
    case 'task_assigned':
      return <User className="w-4 h-4 text-blue-600" />;
    case 'status_updated':
    case 'delivery_completed':
      return <MapPin className="w-4 h-4 text-orange-600" />;
    case 'new_rating':
      return <Star className="w-4 h-4 text-yellow-600" />;
    default:
      return <CheckCircle className="w-4 h-4 text-neutral-600" />;
  }
};

export function NotificationBell() {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (unreadCount > 0) {
      setIsAnimating(true);
      const timer = setTimeout(() => setIsAnimating(false), 2500);
      return () => clearTimeout(timer);
    }
  }, [unreadCount]);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="relative" 
          data-testid="button-notifications"
        >
          <motion.div
            animate={isAnimating ? { scale: [1, 1.2, 1] } : {}}
            transition={{ duration: 0.5 }}
          >
            <Bell className="w-5 h-5" />
          </motion.div>
          {unreadCount > 0 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-1 -right-1 w-5 h-5 bg-red-600 rounded-full flex items-center justify-center"
            >
              <span className="text-xs font-semibold text-white">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            </motion.div>
          )}
          {unreadCount > 0 && (
            <motion.span
              className="absolute -top-1 -right-1 w-5 h-5 bg-red-600 rounded-full"
              animate={{ scale: [1, 1.4, 1], opacity: [0.8, 0.3, 0.8] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold">Notifications</h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={markAllAsRead}
              className="text-xs"
              data-testid="button-mark-all-read"
            >
              Mark all read
            </Button>
          )}
        </div>
        <ScrollArea className="h-[400px]">
          <AnimatePresence>
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                No notifications yet
              </div>
            ) : (
              notifications.slice(0, 10).map((notification, index) => (
                <motion.div
                  key={notification.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: index * 0.05 }}
                  className={`p-4 border-b hover-elevate cursor-pointer ${
                    !notification.isRead ? 'bg-emerald-50 dark:bg-emerald-950/20' : ''
                  }`}
                  onClick={() => markAsRead(notification.id)}
                  data-testid={`notification-${notification.id}`}
                >
                  <div className="flex justify-between items-start gap-3">
                    <div className="flex-shrink-0 mt-1">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm">{notification.title}</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {notification.message}
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">
                        {formatDistanceToNow(new Date(notification.createdAt || Date.now()), { addSuffix: true })}
                      </p>
                    </div>
                    {!notification.isRead && (
                      <div className="w-2 h-2 bg-primary rounded-full" />
                    )}
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
