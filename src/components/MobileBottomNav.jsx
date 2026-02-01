'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home,
  Search,
  MessageCircle,
  Bell,
  Users,
  BookOpen,
  CreditCard,
  Settings,
  LogOut,
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

  // Check if we're on the dashboard
  const isDashboard = pathname === '/dashboard' || pathname.startsWith('/dashboard/');

  // Main navigation items (4 primary icons)
  const primaryNavItems = [
    {
      label: 'Home',
      icon: Home,
      href: '/dashboard',
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
      label: 'Notifications',
      icon: Bell,
      href: '/notification',
      badge: null,
    },
  ];

  // Additional menu items (visible when "More" is clicked)
  const additionalMenuItems = [
    {
      label: 'Users',
      icon: Users,
      href: '/management/user',
    },
    {
      label: 'Resources',
      icon: BookOpen,
      href: '#',
    },
    {
      label: 'Billing',
      icon: CreditCard,
      href: '#',
    },
    {
      label: 'Settings',
      icon: Settings,
      href: '#',
    },
    {
      label: 'Logout',
      icon: LogOut,
      href: '#',
      isLogout: true,
    },
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
      {/* Mobile Bottom Navigation - visible only on small screens */}
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
                      ? 'text-blue-600 dark:text-blue-400 bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-900/40 dark:to-blue-800/20 shadow-md'
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
                      className="absolute -bottom-2 w-1.5 h-1.5 bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 rounded-full shadow-lg"
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
              {/* Menu Header with gradient background */}
              <div className="sticky top-0 flex items-center justify-between p-6 bg-gradient-to-r from-blue-600 via-blue-500 to-purple-600 dark:from-blue-900 dark:via-blue-800 dark:to-purple-900 text-white border-b border-gray-200 dark:border-gray-700 shadow-lg">
                <div className="flex items-center gap-3">
                  <motion.div
                    initial={{ rotate: -180 }}
                    animate={{ rotate: 0 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                    className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center"
                  >
                    <Menu className="w-5 h-5" strokeWidth={2} />
                  </motion.div>
                  <h2 className="text-xl font-bold">Menu</h2>
                </div>
                <motion.button
                  onClick={() => setSideMenuOpen(false)}
                  whileTap={{ scale: 0.9 }}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <X className="w-6 h-6" strokeWidth={2} />
                </motion.button>
              </div>

              {/* Menu Items with staggered animation */}
              <div className="p-4 space-y-2">
                {additionalMenuItems.map((item, index) => {
                  const Icon = item.icon;

                  if (item.isLogout) {
                    return (
                      <motion.button
                        key={item.label}
                        initial={{ x: -30, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ 
                          delay: index * 0.06,
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
                    );
                  }

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
