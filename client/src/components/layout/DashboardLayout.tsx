import { ReactNode } from 'react';
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider } from '@/components/ui/sidebar';
import { Home, Package, Heart, Truck, Users, Settings, HelpCircle, LayoutDashboard, BarChart3 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Link, useLocation } from 'wouter';
import { NotificationBell } from '@/components/shared/NotificationBell';
import { ProfileDropdown } from '@/components/shared/ProfileDropdown';
import { SidebarTrigger } from '@/components/ui/sidebar';

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user } = useAuth();
  const [location] = useLocation();

  const roleMenus = {
    donor: [
      { title: 'Dashboard', url: '/donor', icon: LayoutDashboard },
      { title: 'My Donations', url: '/donor/donations', icon: Package },
      { title: 'Impact Report', url: '/donor/impact', icon: Home },
    ],
    ngo: [
      { title: 'Dashboard', url: '/ngo', icon: LayoutDashboard },
      { title: 'Browse Donations', url: '/ngo/browse', icon: Package },
      { title: 'My Donations', url: '/ngo/donations', icon: Heart },
    ],
    volunteer: [
      { title: 'Dashboard', url: '/volunteer', icon: LayoutDashboard },
      { title: 'Available Tasks', url: '/volunteer/tasks', icon: Truck },
      { title: 'My Deliveries', url: '/volunteer/deliveries', icon: Package },
    ],
    admin: [
      { title: 'Dashboard', url: '/admin', icon: LayoutDashboard },
      { title: 'User Management', url: '/admin/users', icon: Users },
      { title: 'All Donations', url: '/admin/donations', icon: Package },
    ],
  };

  const commonMenu = [
    { title: 'Settings', url: '/settings', icon: Settings },
    { title: 'Help', url: '/help', icon: HelpCircle },
  ];

  const menuItems = user?.role ? [...roleMenus[user.role as keyof typeof roleMenus], ...commonMenu] : commonMenu;

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full">
        <Sidebar>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel className="text-lg font-bold px-4 py-3">
                <Link href="/" className="flex items-center gap-2">
                  <Package className="w-6 h-6 text-primary" />
                  FoodRescue
                </Link>
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {menuItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild isActive={location === item.url}>
                        <Link href={item.url} data-testid={`nav-${item.title.toLowerCase().replace(/\s+/g, '-')}`}>
                          <item.icon />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>

        <div className="flex flex-col flex-1">
          <header className="flex items-center justify-between p-4 border-b bg-background">
            <SidebarTrigger data-testid="button-sidebar-toggle" />
            <div className="flex items-center gap-4">
              <NotificationBell />
              <ProfileDropdown />
            </div>
          </header>
          <main className="flex-1 overflow-auto bg-background">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
