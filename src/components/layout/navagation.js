'use client'

import React, { useState,useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, MessageCircle, User, Sun, Moon, LogOut, Search, Menu, X, CreditCard, Settings } from 'lucide-react';
import { useTheme } from '@/lib/theme'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from '@/components/ui/button'
import Link from "next/link"
import { useAuth } from '@/components/auth/AuthProvider'
import {
  Dialog,
  DialogContent,
  DialogDescription,  
  DialogHeader,
  DialogTitle,
  DialogTrigger,  
} from "@/components/ui/dialog"
import { chatDarkModeStore } from '../../stores/userStore';
import DialogDemo from "@/components/ui/dialogeDemo"
import toast from 'react-hot-toast'
import {useRouter} from 'next/navigation'
export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const router = useRouter();
  const {visible,setVisible,clearVisible} = chatDarkModeStore();
  const { logout } = useAuth()
  const { theme, toggle } = useTheme()

  useEffect(() => {
    try {
      const user = localStorage.getItem("user");
      if (user) {
        setCurrentUser(JSON.parse(user));
      }
    } catch (err) {
      console.error("Error loading user from localStorage:", err);
    }
  }, []);
  const [userProfileImage,setUserProfileImage]=useState(null);
  useEffect(()=>{
    const fullInformation = localStorage.getItem("fullInfo");
    if(fullInformation){
      setUserProfileImage(JSON.parse(fullInformation));
    }
    console.log("user profile image",userProfileImage)
  },[])
  const getProfileImageSrc = (img) => {
    if (!img) return null;
    if (img.startsWith('/') || img.startsWith('http')) return img;
    if (img.includes('uploads')) return img.startsWith('/') ? img : `/${img}`;
    if (img.startsWith('profiles') || img.startsWith('profile')) return `/uploads/${img}`;
    return `/uploads/profiles/${img}`;
  }
  useEffect(() => {
    const findUserProfile = async () => {
      try {
        const userEmail = currentUser?.email;
        // Only fetch if we have an email and don't already have the profile image
        if (!userEmail || currentUser?.profile_image_url) return;

        const response = await fetch("/api/users");
        const data = await response.json();
console.log("data which I am fetching ",data);
        if (data.users && Array.isArray(data.users)) {
          const userProfile = data.users.find(
            (user) => user.email === userEmail
          );

          // Only update state if the profile image exists and differs from current
          if (
            userProfile &&
            userProfile.profile_image &&
            userProfile.profile_image !== currentUser?.profile_image_url
          ) {
            console.log("user profile image which I am setting ",userProfile.profile_image);
            // Update currentUser with profile image from database
            setCurrentUser((prev) => ({
              ...prev,
              profile_image_url: userProfile.profile_image,
            }));

            // Also update localStorage safely (only if different)
            try {
              const stored = localStorage.getItem("user");
              if (!stored || JSON.parse(stored)?.profile_image_url !== userProfile.profile_image) {
                const updatedUser = {
                  ...currentUser,
                  profile_image_url: userProfile.profile_image,
                };
                localStorage.setItem("user", JSON.stringify(updatedUser));
              }
            } catch (e) {
              console.error('Error saving user to localStorage:', e);
            }

            // Also update fullInfo if present so components that read it get the new image
            try {
              const full = localStorage.getItem('fullInfo');
              if (full) {
                const parsed = JSON.parse(full);
                if (parsed.image_url !== userProfile.profile_image) {
                  parsed.image_url = userProfile.profile_image;
                  localStorage.setItem('fullInfo', JSON.stringify(parsed));
                  setUserProfileImage(parsed);
                }
              }
            } catch (e) {
              console.error('Error updating fullInfo in localStorage:', e);
            }
          }
        }
      } catch (err) {
        console.error("Error fetching user profile:", err);
      }
    };

    findUserProfile();
    // depend on email and profile_image_url explicitly to avoid unnecessary loops
  }, [currentUser?.email, currentUser?.profile_image_url])
  useEffect(() => {
    const handleStorageChange = () => {
      try {
        const user = localStorage.getItem("user");
        if (user) {
          setCurrentUser(JSON.parse(user));
        } else {
          setCurrentUser(null);
        }
        const fullInformation = localStorage.getItem('fullInfo');
        if (fullInformation) {
          setUserProfileImage(JSON.parse(fullInformation));
        } else {
          setUserProfileImage(null);
        }
      } catch (err) {
        console.error("Error updating user from storage:", err);
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);
  const navItems = [
    { path: '/feed', icon: Home, label: 'Feed' },
    { path: '/chat', icon: MessageCircle, label: 'Chat' },
    { path: '/search', icon: Search, label: "Search" },
    { path: '/dashboard', icon: User, label: 'Dashboard' },
  ];
  const getHref =(label)=>{
switch(label){
  case "Dashboard":
    return '/dashboard';
  case "Search":
    return '/search';
  case "Chat":
    return '/chat';
  case "Feed":
    return '/feed';
  default:
    return '/';
}
  }
  const navItem = [
    { path: '/chat', icon: MessageCircle, label: 'Chat' },
  ];
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
    <>
      <nav className="fixed top-0 left-0 pt-2 right-0 z-50 bg-white backdrop-blur-md dark:bg-gray-800/95 border-b border-gray-200 dark:border-gray-700 shadow-sm ">
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
              <Link key={path} href={getHref(label)}>
              <div
                role="link"
                data-path={path}
                className="flex items-center space-x-2 px-2 lg:px-3 py-2 rounded-lg transition-colors duration-200 text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700"

              >
                <Icon className="h-4 w-4" />
                <span className="font-medium text-sm lg:text-base cursor-pointer"
                >{label}</span>
              </div>
              </Link>
            ))}
          </div>

          {/* Desktop User Actions */}
          <div className="hidden md:flex items-center space-x-2 lg:space-x-3">
            <ProfileDropdown theme={theme} toggleTheme={toggle} onLogout={()=>{
              logout()
              toast.success("Logged out successfully")
              }} />
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
            <div
              key={path}
              data-path={path}
              className="flex-1 flex flex-col items-center py-2 transition-colors duration-200 text-gray-600 dark:text-gray-400"
            >
              <Icon className="h-5 w-5" />
              <span className="text-xs font-medium mt-1">{label}</span>
            </div>
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
                      key={`${path}-${i}`}
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
                <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                  <div className="flex items-center space-x-3">
                    <img
                      src={currentUser?.profile_image_url || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face"}
                      alt={currentUser?.username || 'User'}
                      className="w-10 h-10 rounded-full object-cover border-2 border-white dark:border-gray-700"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-800 dark:text-gray-100 truncate">
                        {currentUser?.username || 'User Profile'}
                      </p>
                      <div className="flex space-x-3 mt-1">
                            <div className="text-sm text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 cursor-pointer">
                              <ThemeToggle inline />
                            </div>
                        <div className="text-sm text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 cursor-pointer"
                          onClick={() => logout()}
                        >
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
      <DialogDemo open={editProfileOpen} setOpen={setEditProfileOpen} />
    </>
  )

  function ProfileDropdown({ theme, toggleTheme, onLogout }) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button className="relative h-10 w-10 rounded-full p-0" variant="outline">
            <Avatar>
              <AvatarImage alt="user" src={
                // prefer currentUser (from API) then local fullInfo image, normalized
                currentUser?.profile_image_url ? getProfileImageSrc(currentUser.profile_image_url) : (userProfileImage?.image_url ? getProfileImageSrc(userProfileImage.image_url) : '/default.png')
              } 
              className="object-cover"
              />
              <AvatarFallback>{currentUser?.username?.[0]?.toUpperCase() || 'U'}</AvatarFallback>
            </Avatar>
            <span className="absolute right-0 bottom-0 h-3 w-3 rounded-full bg-green-500 ring-2 ring-background" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64">
          <DropdownMenuLabel className="font-normal">
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12">
                <AvatarImage alt="user" src={ currentUser?.profile_image_url ? getProfileImageSrc(currentUser.profile_image_url) : (userProfileImage?.image_url ? getProfileImageSrc(userProfileImage.image_url) : '/default.png') }  />
                <AvatarFallback>{currentUser?.username?.[0]?.toUpperCase() || 'U'}</AvatarFallback>
              </Avatar>
              <div className="flex flex-col space-y-1">
                <p className="font-medium text-sm leading-none">{currentUser?.username || 'User Profile'}</p>
                <p className="text-muted-foreground text-xs leading-none">{currentUser?.email || 'user@example.com'}</p>
              </div>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={toggleTheme} className="cursor-pointer">
            {theme === 'dark' ? <Sun className="mr-2 h-4 w-4" /> : <Moon className="mr-2 h-4 w-4" />}
            {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setEditProfileOpen(true)}>
            <User className="mr-2 h-4 w-4" />
            Edit Profile
          </DropdownMenuItem>
          <DropdownMenuItem>
            <CreditCard className="mr-2 h-4 w-4" />
            Billing
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Settings className="mr-2 h-4 w-4" />
            Account Settings
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={onLogout} className="text-red-600 dark:text-red-400 cursor-pointer">
            <LogOut className="mr-2 h-4 w-4" />
            Log Out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  function ThemeToggle({ inline = false }) {
    const { theme, toggle } = useTheme()

    if (inline) {
      return (
        <button onClick={toggle} className="flex items-center space-x-2">
          {theme === 'dark' ? <Sun className="h-4 w-4 text-yellow-300"/> :<span><Moon className="h-4 w-4 text-gray-700"/></span> }
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