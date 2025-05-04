import React, { useState, useEffect, useRef } from 'react';
import { Link, Outlet, useLocation, Navigate } from 'react-router-dom';
import { 
  BarChart3, 
  Users, 
  FolderKanban, 
  FileText, 
  Settings,
  LogOut,
  Home,
  UserCircle,
  MessageSquare,
  BookOpen,
  Menu,
  X
} from 'lucide-react';
import { useAuthStore } from '../../lib/store';
import { cn, getInitials } from '../../lib/utils';
import type { Role } from '../../types/auth';

interface MenuItem {
  name: string;
  href: string;
  icon: React.ElementType;
  roles?: Role[];
}

const adminNavigation: MenuItem[] = [
  { name: 'แดชบอร์ด', href: '/admin', icon: BarChart3 },
  { name: 'โปรไฟล์', href: '/admin/profile', icon: UserCircle },
  { name: 'จัดการผู้ใช้', href: '/admin/users', icon: Users, roles: ['admin'] },
  { name: 'จัดการโครงการ', href: '/admin/projects', icon: FolderKanban, roles: ['admin', 'editor'] },
  { name: 'ใบสมัครและผลงาน', href: '/admin/submissions', icon: FileText, roles: ['admin', 'editor', 'commentor'] },
  { name: 'ตั้งค่า', href: '/admin/settings', icon: Settings, roles: ['admin'] },
];

const userNavigation: MenuItem[] = [
  { name: 'หน้าหลัก', href: '/user', icon: Home },
  { name: 'โปรไฟล์', href: '/user/profile', icon: UserCircle },
  { name: 'โครงการ', href: '/projects', icon: FolderKanban },
  { name: 'การสมัคร', href: '/user/applications', icon: FileText },
  { name: 'ข้อความ', href: '/user/messages', icon: MessageSquare },
  { name: 'แหล่งเรียนรู้', href: '/user/resources', icon: BookOpen },
  { name: 'การตั้งค่า', href: '/user/settings', icon: Settings },
];

const roleColors: Record<Role, {
  bg: string;
  hover: string;
  active: string;
  text: string;
}> = {
  admin: {
    bg: 'bg-brand-navy',
    hover: 'hover:bg-brand-navy/90',
    active: 'bg-brand-navy-light',
    text: 'text-red-500',
  },
  editor: {
    bg: 'bg-yellow-600',
    hover: 'hover:bg-yellow-700',
    active: 'bg-yellow-500',
    text: 'text-yellow-500',
  },
  commentor: {
    bg: 'bg-emerald-800',
    hover: 'hover:bg-emerald-900',
    active: 'bg-emerald-700',
    text: 'text-emerald-500',
  },
  viewer: {
    bg: 'bg-emerald-900',
    hover: 'hover:bg-emerald-800',
    active: 'bg-emerald-700',
    text: 'text-emerald-400',
  },
};

export function Layout() {
  const { user, logout } = useAuthStore();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);
  const minSwipeDistance = 50;

  // Check if the current user is an admin
  const isAdmin = user?.role === 'admin';

  // Use admin navigation for admin users, user navigation for others
  const navigation = isAdmin ? adminNavigation : userNavigation;
  const basePath = isAdmin ? '/admin' : '/user';

  const userRole = user?.role || 'viewer';
  const colors = roleColors[userRole];

  // Filter navigation items based on user role
  const filteredNavigation = navigation.filter(item => {
    // If no roles specified, show to everyone
    if (!item.roles) return true;
    // Otherwise, only show if user has required role
    return item.roles.includes(userRole);
  });

  // Handle touch events for swipe gesture
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    const swipeDistance = touchEndX.current - touchStartX.current;
    
    if (Math.abs(swipeDistance) > minSwipeDistance) {
      if (swipeDistance > 0 && !isSidebarOpen) {
        // Swipe right, open sidebar
        setIsSidebarOpen(true);
      } else if (swipeDistance < 0 && isSidebarOpen) {
        // Swipe left, close sidebar
        setIsSidebarOpen(false);
      }
    }
  };

  // Close sidebar when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sidebarRef.current && !sidebarRef.current.contains(event.target as Node)) {
        setIsSidebarOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close sidebar on route change
  useEffect(() => {
    setIsSidebarOpen(false);
  }, [location.pathname]);

  // Redirect non-admin users trying to access admin routes
  if (location.pathname.startsWith('/admin') && !isAdmin) {
    return <Navigate to="/user" replace />;
  }

  return (
    <div 
      className="min-h-screen bg-gray-50"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Mobile Header */}
      <div className="md:hidden bg-white border-b sticky top-0 z-40">
        <div className="px-4 h-16 flex items-center justify-between">
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 rounded-lg hover:bg-gray-100"
          >
            <Menu className="w-6 h-6 text-gray-600" />
          </button>
          <Link to="/" className="font-semibold text-lg text-brand-navy">
            {isAdmin ? 'OFOS Admin' : 'OFOS Film Camp'}
          </Link>
          <div className="w-10" /> {/* Spacer for alignment */}
        </div>
      </div>

      {/* Sidebar Overlay */}
      {isSidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 md:hidden" />
      )}

      {/* Sidebar */}
      <div
        ref={sidebarRef}
        className={cn(
          "fixed inset-y-0 left-0 w-64 z-50 transform transition-transform duration-300 ease-in-out",
          colors.bg,
          isSidebarOpen ? "translate-x-0" : "-translate-x-full",
          "md:translate-x-0 md:z-30"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="h-16 flex items-center px-6 justify-between">
            <Link to="/" className="text-white font-semibold text-lg">
              {isAdmin ? 'OFOS Admin' : 'OFOS Film Camp'}
            </Link>
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="md:hidden p-2 rounded-lg hover:bg-white/10 text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
            {filteredNavigation.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={cn(
                    "flex items-center px-4 py-2 text-sm rounded-lg transition-colors",
                    location.pathname === item.href
                      ? `${colors.active} text-white`
                      : `text-gray-300 ${colors.hover} hover:text-white`
                  )}
                >
                  <Icon className="w-5 h-5 mr-3" />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* Footer with user info */}
          <div className="p-4 border-t border-white/10">
            <div className="flex items-center space-x-3 mb-4">
              {user?.profileImage ? (
                <img 
                  src={user.profileImage}
                  alt={user.fullName}
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <div className={cn("w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-medium", colors.active)}>
                  {user?.fullName ? getInitials(user.fullName) : 'U'}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-white font-medium text-sm truncate">{user?.fullName}</p>
                <p className={cn("text-xs font-medium capitalize", colors.text)}>
                  {userRole === 'admin' ? 'ผู้ดูแลระบบ' :
                   userRole === 'editor' ? 'บรรณาธิการ' :
                   userRole === 'commentor' ? 'ผู้ให้ความเห็น' : 'ผู้ใช้งาน'}
                </p>
              </div>
              <button
                onClick={() => logout()}
                className="p-2 text-gray-300 hover:text-white rounded-lg transition-colors flex-shrink-0"
                title="ออกจากระบบ"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="md:pl-64">
        <main className="py-8">
          <div className="px-4 md:px-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}