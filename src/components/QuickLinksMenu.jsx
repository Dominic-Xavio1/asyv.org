'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Bell, Home, LayoutList, Menu, MessageCircle, Search, ShieldCheck, UserCog, UserPlus, Users, X } from 'lucide-react';

export default function QuickLinksMenu() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [isCrcOrSuperuser, setIsCrcOrSuperuser] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const fullInfo = localStorage.getItem('fullInfo');
      if (!fullInfo) return;
      const user = JSON.parse(fullInfo);
      setIsCrcOrSuperuser(user?.is_crc === true || user?.is_superuser === true);
    } catch (error) {
      console.error('Failed to load user role for quick menu:', error);
    }
  }, []);

  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  const links = useMemo(() => {
    const baseLinks = [
      { id: 'dashboard', href: '/dashboard', label: 'Dashboard', icon: Home },
      { id: 'feed', href: '/feed', label: 'Feed', icon: LayoutList },
      { id: 'search', href: '/search', label: 'Search', icon: Search },
      { id: 'chat', href: '/chat', label: 'Chat', icon: MessageCircle },
      { id: 'notifications', href: '/notification', label: 'Notifications', icon: Bell },
      { id: 'create_profile', href: '/profile/create', label: 'Create Profile', icon: UserPlus },
      { id: 'change_password', href: '/profile/change-password', label: 'Change Password', icon: ShieldCheck },
    ];

    if (isCrcOrSuperuser) {
      baseLinks.splice(
        5,
        0,
        { id: 'manage_users', href: '/management/user', label: 'Manage Users', icon: UserCog },
        { id: 'our_students', href: '/management/advanced', label: 'Our Students', icon: Users }
      );
    }

    return baseLinks;
  }, [isCrcOrSuperuser]);

  if (pathname === '/' || pathname.startsWith('/login')) return null;

  return (
    <div className="fixed left-4 bottom-24 md:bottom-6 z-50">
      {isOpen && (
        <div className="mb-2 w-64 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-xl p-2 max-h-[60vh] overflow-y-auto">
          {links.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.id}
                href={item.href}
                className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition ${
                  isActive
                    ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      )}

      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex items-center gap-2 rounded-full bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 shadow-lg transition"
      >
        {isOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        <span className="text-sm font-medium">Menu</span>
      </button>
    </div>
  );
}
