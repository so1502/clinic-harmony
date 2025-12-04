import { Link, useLocation } from 'react-router-dom';
import { 
  Calendar, 
  Users, 
  UserCircle, 
  Home, 
  Settings, 
  DoorOpen,
  Stethoscope,
  LogOut,
  Building2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';

const navItems = [
  { icon: Home, label: 'Dashboard', href: '/dashboard', roles: ['system_admin', 'clinic_admin', 'therapist', 'receptionist'] },
  { icon: Calendar, label: 'Calendar', href: '/calendar', roles: ['system_admin', 'clinic_admin', 'therapist', 'receptionist'] },
  { icon: Users, label: 'Patients', href: '/patients', roles: ['system_admin', 'clinic_admin', 'therapist', 'receptionist'] },
  { icon: UserCircle, label: 'Therapists', href: '/therapists', roles: ['system_admin', 'clinic_admin', 'receptionist'] },
  { icon: Stethoscope, label: 'Therapy Types', href: '/therapy-types', roles: ['system_admin', 'clinic_admin'] },
  { icon: DoorOpen, label: 'Rooms', href: '/rooms', roles: ['system_admin', 'clinic_admin'] },
  { icon: Building2, label: 'Clinics', href: '/clinics', roles: ['system_admin'] },
  { icon: Settings, label: 'Settings', href: '/settings', roles: ['system_admin', 'clinic_admin'] },
];

export function Sidebar() {
  const location = useLocation();
  const { profile, roles, signOut, isAdmin } = useAuth();

  const filteredNavItems = navItems.filter(item => 
    item.roles.some(role => roles.includes(role as any))
  );

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-sidebar flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-sidebar-border">
        <Link to="/dashboard" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-sidebar-primary flex items-center justify-center">
            <Calendar className="w-5 h-5 text-sidebar-primary-foreground" />
          </div>
          <span className="font-display text-xl font-bold text-sidebar-foreground">
            TherapyHub
          </span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {filteredNavItems.map((item) => {
          const isActive = location.pathname === item.href || 
            (item.href !== '/dashboard' && location.pathname.startsWith(item.href));
          
          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                'sidebar-item',
                isActive && 'sidebar-item-active'
              )}
            >
              <item.icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* User section */}
      <div className="p-4 border-t border-sidebar-border">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-sidebar-accent flex items-center justify-center">
            <span className="text-sm font-semibold text-sidebar-foreground">
              {profile?.full_name?.charAt(0)?.toUpperCase() || 'U'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-sidebar-foreground truncate">
              {profile?.full_name || 'User'}
            </p>
            <p className="text-xs text-sidebar-foreground/60 truncate">
              {roles[0]?.replace('_', ' ') || 'No role'}
            </p>
          </div>
        </div>
        <Button 
          variant="ghost" 
          className="w-full justify-start text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"
          onClick={signOut}
        >
          <LogOut className="w-4 h-4 mr-2" />
          Sign out
        </Button>
      </div>
    </aside>
  );
}
