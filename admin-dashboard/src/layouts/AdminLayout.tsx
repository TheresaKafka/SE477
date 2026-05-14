import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, ShoppingCart, Home, Settings, LogOut,
  Menu, Bell, Sun, Moon, CreditCard, MessageSquare, Shield, Building2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { useTheme } from '@/store/theme';

const sidebarNavItems = [
  { title: 'Dashboard', href: '/', icon: LayoutDashboard },
  { title: 'Users', href: '/users', icon: Users },
  { title: 'Roles', href: '/roles', icon: Shield },
  { title: 'Properties', href: '/properties', icon: Building2 },
  { title: 'Rooms', href: '/rooms', icon: Home },
  { title: 'Orders', href: '/orders', icon: ShoppingCart },
  { title: 'Payments', href: '/payments', icon: CreditCard },
  { title: 'Reviews', href: '/reviews', icon: MessageSquare },
];

function SidebarNav({ onLinkClick }: { onLinkClick?: () => void }) {
  return (
    <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
      {sidebarNavItems.map((item) => (
        <NavLink
          key={item.href}
          to={item.href}
          end={item.href === '/'}
          onClick={onLinkClick}
          className={({ isActive }) =>
            cn(
              'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all',
              isActive
                ? 'bg-primary/10 text-primary'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            )
          }
        >
          <item.icon className="h-4 w-4 flex-shrink-0" />
          {item.title}
        </NavLink>
      ))}
    </nav>
  );
}

export default function AdminLayout() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  // Lấy thông tin user từ localStorage
  const userStr = localStorage.getItem('user');
  const currentUser = userStr ? (() => { try { return JSON.parse(userStr); } catch { return null; } })() : null;
  const userEmail = currentUser?.email || 'admin@example.com';
  const userInitials = userEmail.slice(0, 2).toUpperCase();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 flex-col border-r bg-card h-screen sticky top-0">
        <div className="h-16 flex items-center px-6 border-b">
          <h2 className="text-lg font-bold tracking-tight">
            Admin<span className="text-primary">Panel</span>
          </h2>
        </div>
        <SidebarNav />
        <div className="p-3 border-t">
          <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-muted/50">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                {userInitials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium truncate">{userEmail}</p>
              <p className="text-xs text-muted-foreground">Administrator</p>
            </div>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="h-16 flex items-center justify-between border-b bg-card px-4 md:px-6 sticky top-0 z-30">
          <div className="flex items-center gap-4">
            {/* Mobile Menu */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="md:hidden">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-64 p-0">
                <div className="h-16 flex items-center px-6 border-b">
                  <h2 className="text-lg font-bold">
                    Admin<span className="text-primary">Panel</span>
                  </h2>
                </div>
                <SidebarNav />
              </SheetContent>
            </Sheet>

            <span className="hidden md:block text-sm text-muted-foreground font-medium">
              SE477 — Travel Rental Management
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={toggleTheme} title="Toggle theme">
              {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>
            <Button variant="ghost" size="icon" className="relative" title="Notifications">
              <Bell className="h-5 w-5" />
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 w-9 rounded-full p-0">
                  <Avatar className="h-9 w-9">
                    <AvatarFallback className="bg-primary text-primary-foreground text-sm font-semibold">
                      {userInitials}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">Administrator</p>
                    <p className="text-xs leading-none text-muted-foreground truncate">{userEmail}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-destructive cursor-pointer">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 p-4 md:p-6 overflow-auto">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
