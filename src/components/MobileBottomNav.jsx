'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home,
  Search,
  MessageCircle,
  Bell,
  Users,
  User,
  BookOpen,
  CreditCard,
  Settings,
  LogOut,
  LayoutList,
  BarChart3,
  UserCog,
  UserPlus,
  ShieldCheck,
  Menu,
  X,
  ChevronRight,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthProvider';
import toast from 'react-hot-toast';

const MobileBottomNav = () => {
  const [sideMenuOpen, setSideMenuOpen] = useState(false);
  const pathname = usePathname();
  const { logout } = useAuth();
  // Placeholder for unread notifications (replace with real value from store/service)
  const unreadCount = 0;

  // Check if we're on the dashboard
  const isDashboard = pathname === '/dashboard' || pathname.startsWith('/dashboard/');

  // Main navigation items (4 primary icons)
  const primaryNavItems = [
    {
      label: 'Feed',
      icon: Home,
      href: '/feed',
      badge: null,
    },
    {
      label: 'Search',
      icon: Search,
      href: '/search',
      badge: null,
    },
    {
      label: 'Chat',
      icon: MessageCircle,
      href: '/chat',
      badge: null,
    },
    {
      label: 'Dashboard',
      icon: User,
      href: '/dashboard',
      badge: null,
    },
  ];
  const menuItems = [
    { id: 'home', icon: Home, label: 'Dashboard', href: '/feed' },
    { id: 'notifications', icon: User, label: 'Dashboard', badge: unreadCount, href: '/dashboard' },
    { id: 'feed', icon: LayoutList, label: 'Feed', href: '/feed' },
    { id: 'alumni_overview', icon: BarChart3, label: 'Alumni Overview', href: '/management/alumni-overview' },
    { id: 'management', icon: UserCog, label: 'Manage Users', href: '/management/user' },
    { id: 'advanced_management', icon: Users, label: 'Advanced User Management', href: '/management/advanced' },
    { id: 'create_profile', icon: UserPlus, label: 'Create your profile', href: '/profile/create' },
    { id: 'change_password', icon: ShieldCheck, label: 'Change Password', href: '/profile/change-password' },
    // { id: 'logout', icon: LogOut, label: 'Logout', isLogout: true },
  ];


  const isActive = (href) => {
    if (href === '#') return false;
    return pathname === href || pathname.startsWith(href);
  };

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Logged out successfully');
    } catch (error) {
      toast.error('Failed to logout');
    }
  };

  return (
    <>
    {pathname === '/' ? (<></>):(

      <div className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-white dark:bg-gray-950 border-t border-gray-200 dark:border-gray-800 shadow-2xl backdrop-blur-xl bg-white/80 dark:bg-gray-950/80">
        <nav className="flex items-center justify-around h-20 px-2">
          {primaryNavItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);

            return (
              <Link key={item.label} href={item.href}>
                <motion.button
                  whileTap={{ scale: 0.85 }}
                  className={`flex flex-col items-center justify-center w-16 h-16 rounded-2xl transition-all duration-300 relative mobile-nav-item ${
                    active
                      ? 'text-orange-600 dark:text-orange-400 bg-gradient-to-br from-orange-50 to-orange-100/50 dark:from-orange-900/40 dark:to-orange-800/20 shadow-md'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100/50 dark:hover:bg-gray-800/50'
                  }`}
                >
                  <motion.div
                    initial={{ scale: 1 }}
                    whileTap={{ scale: 1.2 }}
                    className="relative"
                  >
                    <Icon className="w-6 h-6" strokeWidth={1.5} />
                    {item.badge && (
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -top-2 -right-2 bg-gradient-to-br from-red-500 to-red-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center shadow-lg"
                      >
                        {item.badge}
                      </motion.span>
                    )}
                  </motion.div>
                  <span className="text-xs font-semibold mt-1 text-gray-700 dark:text-gray-300">{item.label}</span>

                  {/* Active indicator - animated dot */}
                  {active && (
                    <motion.div
                      layoutId="activeIndicator"
                      className="absolute -bottom-2 w-1.5 h-1.5 bg-gradient-to-r from-orange-600 to-purple-600 dark:from-orange-400 dark:to-purple-400 rounded-full shadow-lg"
                      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    />
                  )}
                </motion.button>
              </Link>
            );
          })}

          {/* More button - only visible on dashboard */}
          {isDashboard && (
            <motion.button
              onClick={() => setSideMenuOpen(!sideMenuOpen)}
              whileTap={{ scale: 0.85 }}
              className={`flex flex-col items-center justify-center w-16 h-16 rounded-2xl transition-all duration-300 relative mobile-nav-item ${
                sideMenuOpen
                  ? 'text-purple-600 dark:text-purple-400 bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-900/40 dark:to-purple-800/20 shadow-md'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100/50 dark:hover:bg-gray-800/50'
              }`}
            >
              <motion.div
                animate={{ rotate: sideMenuOpen ? 90 : 0 }}
                transition={{ duration: 0.3 }}
              >
                {sideMenuOpen ? (
                  <X className="w-6 h-6" strokeWidth={1.5} />
                ) : (
                  <Menu className="w-6 h-6" strokeWidth={1.5} />
                )}
              </motion.div>
              <span className="text-xs font-semibold mt-1 text-gray-700 dark:text-gray-300">More</span>

              {/* Indicator for more menu */}
              {sideMenuOpen && (
                <motion.div
                  layoutId="moreIndicator"
                  className="absolute -bottom-2 w-1.5 h-1.5 bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-400 dark:to-pink-400 rounded-full shadow-lg"
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                />
              )}
            </motion.button>
          )}
        </nav>
      </div>
    )}

      {/* Side Menu - slides from left */}
      <AnimatePresence>
        {sideMenuOpen && (
          <>
            {/* Backdrop with smooth animation */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setSideMenuOpen(false)}
              className="fixed inset-0 z-30 bg-black/40 dark:bg-black/60 md:hidden backdrop-blur-sm mobile-menu-backdrop"
            />

            {/* Sliding Menu Panel */}
            <motion.div
              initial={{ x: -300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -300, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 280, damping: 28 }}
              className="fixed left-0 top-0 bottom-0 z-40 w-72 bg-white dark:bg-gray-900 shadow-2xl overflow-y-auto mobile-menu-panel"
            >

              {/* Menu Items with staggered animation */}
              <div className="p-4 space-y-2 mb-[290px]">
                {menuItems.map((item, index) => {
                  const Icon = item.icon;

                  return (
                    <Link key={item.label} href={item.href}>
                      <motion.button
                        initial={{ x: -30, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ 
                          delay: index * 0.06,
                          type: 'spring',
                          stiffness: 200,
                          damping: 20
                        }}
                        onClick={() => setSideMenuOpen(false)}
                        whileHover={{ x: 4 }}
                        whileTap={{ scale: 0.98 }}
                        className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800/50 transition-all duration-200 group"
                      >
                        <div className="flex items-center gap-3">
                          <motion.div
                            whileHover={{ scale: 1.1 }}
                            className="p-2 rounded-lg bg-gray-100/50 dark:bg-gray-800/50 group-hover:bg-gray-200/50 dark:group-hover:bg-gray-700/50 transition-colors"
                          >
                            <Icon className="w-5 h-5" strokeWidth={1.5} />
                          </motion.div>
                          <span className="font-semibold">{item.label}</span>
                        </div>
                        <motion.div
                          initial={{ opacity: 0, x: -4 }}
                          whileHover={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <ChevronRight className="w-4 h-4" strokeWidth={2} />
                        </motion.div>
                      </motion.button>
                    </Link>
                  );
                })}
              </div>

              {/* Footer section in menu */}
              <div>
                 {/* if (item.isLogout) {
                    return ( */}
                      <motion.button
                        key="logout"
                        initial={{ x: -30, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ 
                          delay: 0.06,
                          type: 'spring',
                          stiffness: 200,
                          damping: 20
                        }}
                        onClick={() => {
                          handleLogout();
                          setSideMenuOpen(false);
                        }}
                        whileHover={{ x: 4 }}
                        whileTap={{ scale: 0.98 }}
                        className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-200 group"
                      >
                        <div className="flex items-center gap-3">
                          <motion.div
                            whileHover={{ scale: 1.1 }}
                            className="p-2 rounded-lg bg-red-100/50 dark:bg-red-900/30 group-hover:bg-red-200/50 dark:group-hover:bg-red-900/50 transition-colors"
                          >
                            <LogOut className="w-ver5 h-5" strokeWidth={1.5} />
                          </motion.div>
                          <span className="font-semibold">Logout</span>
                        </div>
                        <motion.div
                          initial={{ opacity: 0, x: -4 }}
                          whileHover={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <ChevronRight className="w-4 h-4" strokeWidth={2} />
                        </motion.div>
                      </motion.button>
                    {/* );
                  } */}
              </div>
              <div className="sticky bottom-0 p-4 bg-gradient-to-t from-gray-50 dark:from-gray-800 to-transparent border-t border-gray-200 dark:border-gray-700">
              
                <p className="text-xs text-gray-500 dark:text-gray-400 text-center font-medium">
                  © 2026 asyv.org Platform
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Spacer for mobile to prevent content overlap */}
      <div className="md:hidden h-20" />
    </>
  );
};

export default MobileBottomNav;
