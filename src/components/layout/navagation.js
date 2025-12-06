'use client'

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, MessageCircle, User, Sun, Moon, LogOut, Search, Menu, X } from 'lucide-react';
import { useTheme } from '@/lib/theme'
import {useRouter} from 'next/navigation'
export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const router = useRouter();
  const navItems = [
    { path: '/feed', icon: Home, label: 'Feed' },
    { path: '/chat', icon: MessageCircle, label: 'Chat' },
    { path: '/search', icon: Search, label: "Search" },
    { path: '/dashboard', icon: User, label: 'Dashboard' },
  ];
  
  const navItem = [
    { path: '/chat', icon: MessageCircle, label: 'Chat' },
  ];

  // Static user data for design
  const currentUser = {
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
    name: 'John Doe'
  };

  // Animation variants
  const menuVariants = {
    hidden: { x: '100%', opacity: 0 },
    visible: { 
      x: 0, 
      opacity: 1,
      transition: { type: 'spring', stiffness: 300, damping: 30 }
    },
    exit: { x: '100%', opacity: 0, transition: { duration: 0.2 } }
  };

  const itemVariants = {
    hidden: { x: 50, opacity: 0 },
    visible: (i) => ({
      x: 0,
      opacity: 1,
      transition: { delay: i * 0.1 }
    })
  };

  return (
    <nav className="fixed top-0 left-0 pt-2 right-0 z-50 bg-white/50 backdrop-blur-md dark:bg-gray-800/95 border-b border-gray-200 dark:border-gray-700 shadow-sm ">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-14 lg:h-16">
          {/* Logo */}
          <div className="flex items-center space-x-2 cursor-pointer">
             <img src='/agahozo.png' alt="ASYV Logo" className="w-[60px] h-auto"/>
                     

            <span className="font-bold text-lg lg:text-xl bg-gradient-to-r from-orange-600 to-green-600 bg-clip-text text-transparent">
              PulseVillage
            </span>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-2 lg:space-x-4">
            {navItems.map(({ path, icon: Icon, label }) => (
              <nav
                key={path}
                to={path}
                className="flex items-center space-x-2 px-2 lg:px-3 py-2 rounded-lg transition-colors duration-200 text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <Icon className="h-4 w-4" />
                <span className="font-medium text-sm lg:text-base cursor-pointer"
                onClick={()=>{
                  if(label === 'Dashboard'){
                      router.push("/dashboard")
                  }
                  else if(label === 'Feed'){
                      router.push("/feed")
                  }
                    
                  }}
                >{label}</span>
                {label === 'Dashboard' && (
                  <span className="ml-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full" >
                    3
                  </span>
                )}
              </nav>
            ))}
          </div>

          {/* Desktop User Actions */}
          <div className="hidden md:flex items-center space-x-2 lg:space-x-3">
            <ThemeToggle />
          </div>
          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            <div
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 cursor-pointer"
            >
              {mobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md dark:bg-gray-800/95 border-t border-gray-200 dark:border-gray-700 shadow-lg z-50">
        <div className="flex items-center justify-between py-2 px-4 space-x-2">
          <div className="flex items-center space-x-2 cursor-pointer">
            <div className="w-7 h-7 lg:w-8 lg:h-8 bg-gradient-to-br from-orange-500 to-green-500 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-xs lg:text-sm">CS</span>
            </div>
            <span className="font-bold text-lg lg:text-xl bg-gradient-to-r from-orange-600 to-green-600 bg-clip-text text-transparent">
              ChatSocial
            </span>
          </div>
          
          {navItem.slice(0, 1).map(({ path, icon: Icon, label }) => (
            <nav
              key={path}
              to={path}
              className="flex-1 flex flex-col items-center py-2 transition-colors duration-200 text-gray-600 dark:text-gray-400"
            >
              <Icon className="h-5 w-5" />
              <span className="text-xs font-medium mt-1">{label}</span>
            </nav>
          ))}
           
          <div
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="flex-1 flex flex-col items-center py-2 transition-colors duration-200 text-gray-600 dark:text-gray-400 cursor-pointer"
          >
            {mobileMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <User className="h-5 w-5" />
            )}
            <span className="text-sm font-medium mt-1">More</span>
          </div>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/60 z-40 backdrop-blur-md"
            />
            
            {/* Menu Container */}
            <motion.div
              initial="hidden"
              animate="visible"
              exit="exit"
              variants={menuVariants}
              className="fixed top-0 right-0 z-50 w-72 h-full bg-white dark:bg-gray-900 shadow-xl"
            >
              <div className="h-full flex flex-col">
                {/* Header */}
                <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Menu</h2>
                  <div 
                    onClick={() => setMobileMenuOpen(false)}
                    className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
                  >
                    <X className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                  </div>
                </div>

                {/* Navigation Items */}
                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                  {navItems.map(({ path, icon: Icon, label }, i) => (
                    <motion.div
                      key={path}
                      custom={i}
                      initial="hidden"
                      animate="visible"
                      variants={itemVariants}
                    >
                      <div
                        className="flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-900 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700 cursor-pointer"
                      >
                        <Icon className="h-5 w-5" />
                        <span className="font-medium">{label}</span>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* User Section */}
                <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                  <div className="flex items-center space-x-3">
                    <img
                      src={currentUser.avatar}
                      alt={currentUser.name}
                      className="w-10 h-10 rounded-full object-cover border-2 border-white dark:border-gray-700"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-800 dark:text-gray-100 truncate">
                        {currentUser.name}
                      </p>
                      <div className="flex space-x-3 mt-1">
                            <div className="text-sm text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 cursor-pointer">
                              <ThemeToggle inline />
                            </div>
                        <div className="text-sm text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 cursor-pointer">
                          Logout
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </nav>
  );

    function ThemeToggle({ inline = false }) {
      const { theme, toggle } = useTheme()

      if (inline) {
        return (
          <button onClick={toggle} className="flex items-center space-x-2">
            {theme === 'dark' ? <Sun className="h-4 w-4 text-yellow-300"/> : <Moon className="h-4 w-4 text-gray-700"/>}
            <span className="text-sm">{theme === 'dark' ? 'Dark' : 'Light'}</span>
          </button>
        )
      }

      return (
        <button onClick={toggle} className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
          {theme === 'dark' ? <Sun className="w-5 h-5 text-yellow-300"/> : <Moon className="w-5 h-5 text-gray-700"/>}
        </button>
      )
    }
}