'use client'

import React, { useState,useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, MessageCircle, User, Sun, Moon, LogOut, Search, Menu, X, CreditCard, Compass, Flame, ChevronRight, Loader, ExternalLink } from 'lucide-react';
import { useTheme } from '@/lib/theme'
import { ShimmeringText } from "@/components/animate-ui/primitives/texts/shimmering";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {usePathname} from "next/navigation"
import { ThemeTogglerButton } from "@/components/animate-ui/components/buttons/theme-toggler";
import { ContainerTextFlip } from "@/components/ui/container-text-flip";
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
import { chatDarkModeStore } from '../../stores/userStore';
import DialogDemo from "@/components/ui/dialogeDemo"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import toast from 'react-hot-toast'
import {useRouter} from 'next/navigation'
import { io } from "socket.io-client"
import { useRef } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { ScrollArea } from "@/components/ui/scroll-area"
export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);
  const router = useRouter();
  const socketRef = useRef(null);
  const {visible,setVisible,clearVisible} = chatDarkModeStore();
  const [isMobile, setIsMobile] = useState(false);
  const [opportunitiesOpen, setOpportunitiesOpen] = useState(false);
  const [trendingOpen, setTrendingOpen] = useState(false);
  const [opportunities, setOpportunities] = useState([]);
  const [trendingNews, setTrendingNews] = useState([]);
  const [opportunitiesLoading, setOpportunitiesLoading] = useState(false);
  const [trendingLoading, setTrendingLoading] = useState(false);

  useEffect(() => {
    if (!opportunitiesOpen) return;
    setOpportunitiesLoading(true);
    fetch('/api/opportunity')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.opportunities) setOpportunities(data.opportunities);
        else setOpportunities([]);
      })
      .catch(() => setOpportunities([]))
      .finally(() => setOpportunitiesLoading(false));
  }, [opportunitiesOpen]);

  useEffect(() => {
    if (!trendingOpen) return;
    setTrendingLoading(true);
    fetch('/api/news')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.trending) {
          const flat = [];
          Object.entries(data.trending).forEach(([category, articles]) => {
            (articles || []).forEach((a) => flat.push({ ...a, category }));
          });
          flat.sort((a, b) => new Date(b.publishedAt || 0) - new Date(a.publishedAt || 0));
          setTrendingNews(flat);
        } else setTrendingNews([]);
      })
      .catch(() => setTrendingNews([]))
      .finally(() => setTrendingLoading(false));
  }, [trendingOpen]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const m = window.matchMedia("(max-width: 767px)");
    const handleChange = (e) => setIsMobile(e.matches);
    // Set initial value
    setIsMobile(m.matches);
    // Prefer modern event API if available
    if (m.addEventListener) m.addEventListener('change', handleChange);
    else m.addListener(handleChange);

    return () => {
      if (m.removeEventListener) m.removeEventListener('change', handleChange);
      else m.removeListener(handleChange);
    };
  }, []);
  const { logout } = useAuth()
  const { theme, toggle } = useTheme()
const pathname = usePathname();
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

    if (typeof window !== 'undefined') {
      window.addEventListener("storage", handleStorageChange);
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener("storage", handleStorageChange);
      }
    };
  }, []);
  
  // Fetch unread message notifications and set up socket connection
  useEffect(() => {
    const fetchUnreadMessages = async () => {
      if (!currentUser?.id) return;
      
      try {
        // Get user ID from fullInfo if available
        let userId = currentUser.id;
        try {
          const fullInfo = localStorage.getItem("fullInfo");
          if (fullInfo) {
            const parsed = JSON.parse(fullInfo);
            userId = parsed.id || userId;
          }
        } catch (e) {
          console.error("Error parsing fullInfo:", e);
        }
        
        const response = await fetch(
          `/api/notifications?userId=${userId}&type=message&limit=100`
        );
        const data = await response.json();
        
        if (data.success) {
          // Count unread message notifications
          const unreadMessages = (data.data || []).filter(n => !n.is_read);
          setUnreadMessageCount(unreadMessages.length);
        }
      } catch (error) {
        console.error("Error fetching unread message notifications:", error);
      }
    };
    
    fetchUnreadMessages();
    
    // Set up Socket.IO connection for real-time message notifications
    if (currentUser?.id && !socketRef.current && typeof window !== "undefined") {
      try {
        let userId = currentUser.id;
        try {
          const fullInfo = localStorage.getItem("fullInfo");
          if (fullInfo) {
            const parsed = JSON.parse(fullInfo);
            userId = parsed.id || userId;
          }
        } catch (e) {
          // ignore
        }
        
        const socketInstance = io(process.env.NEXT_PUBLIC_SOCKET_URL || window.location.origin, {
          path: "/api/socketio",
          transports: ["websocket", "polling"],
        });

        socketInstance.on("connect", () => {
          console.log("Socket connected for message notifications in navbar");
          socketInstance.emit("join_notifications", { userId });
        });

        socketInstance.on("new_notification", (notification) => {
          // Only update count if it's a message notification
          if (notification.type === "message") {
            setUnreadMessageCount((prev) => prev + 1);
          }
        });

        socketInstance.on("notification_count_updated", ({ unreadCount: count }) => {
          // Refetch to get accurate message count
          fetchUnreadMessages();
        });

        socketRef.current = socketInstance;
      } catch (error) {
        console.error("Error initializing socket:", error);
      }
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [currentUser]);
  
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
    { path: '/feed', icon: Home, label: 'Feed' },
    { path: '/search', icon: Search, label: "Search" },
    { path: '/dashboard', icon: User, label: 'Dashboard' },
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
      <nav className=" fixed top-0 left-0 pt-2 right-0 z-50 bg-white backdrop-blur-md dark:bg-gray-800/95 border-b border-gray-200 dark:border-gray-700 shadow-sm ">
      <div className="container mx-auto px-12">
        <div className="flex justify-between items-center h-14 lg:h-16">
          {/* Logo */}
          <div className="flex items-center cursor-pointer">
            <img src="/agahozo.png" alt="ASYV Logo" className="hidden md:block w-[70px] h-auto object-cover" />
            <img src="/asyv.png" alt="ASYV Small" className="md:hidden w-[42px] h-auto object-cover" />
            {/* <ContainerTextFlip  words={["CHOOSE","LISTEN","BRIGHT"]}/> */}
            { (isMobile || !pathname.includes("/dashboard")) && (
              <ShimmeringText
                text="Village Hub"
                className="text-lg md:text-3xl font-bold ml-3"
                duration={2}
                color="#f97316"
                // #0c8438
                // #864108ff 
                shimmeringColor="#864108ff "
              />
            )}
          </div>
         
          <div className="hidden md:flex items-center space-x-2 lg:space-x-4">
            {navItems.map(({ path, icon: Icon, label }) => (
              <Link key={path} href={getHref(label)}>
              <div
                role="link"
                data-path={path}
                className="flex items-center space-x-2 px-2 lg:px-3 py-2 rounded-lg transition-colors duration-200 text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 relative"

              >
                <Icon className="h-4 w-4" />
                <span className="font-medium text-sm lg:text-base cursor-pointer"
                >{label}</span>
                {label === "Chat" && unreadMessageCount > 0 && (
                  <span className="relative flex items-center justify-center">
                    {unreadMessageCount > 0 && (
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-orange-400 opacity-75"></span>
                    )}
                    <span className="relative px-1.5 py-0.5 text-xs font-semibold bg-orange-500 text-white rounded-full min-w-[1.25rem] flex items-center justify-center">
                      {unreadMessageCount > 99 ? '99+' : unreadMessageCount}
                    </span>
                  </span>
                )}
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

      {/* Mobile menu overlay and drawer are rendered outside the top nav to avoid stacking/positioning issues */}
      </nav>
    <AnimatePresence>
      {mobileMenuOpen && (
        <>
          {/* Overlay - placed above nav */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMobileMenuOpen(false)}
            className="fixed inset-0 bg-black/60 z-50 backdrop-blur-md"
          />

          {/* Menu Container - higher z-index so it sits above nav */}
          <motion.div
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={menuVariants}
            className="fixed top-0 right-0 z-60 w-72 h-full bg-white dark:bg-gray-900 shadow-xl"
          >
            <Card className="h-full flex flex-col">
              {/* Header */}
              <div className="flex justify-between items-center p-4  border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Menu</h2>
                <div 
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
                >
                  <X className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                </div>
              </div>

              {/* Navigation Items - From Feed (not visible on mobile feed) */}
              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-4 pb-2">From Feed</div>
                <motion.div custom={0} initial="hidden" animate="visible" variants={itemVariants}>
                  <div
                    onClick={() => { setOpportunitiesOpen(true); setMobileMenuOpen(false); }}
                    className="flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-900 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700 cursor-pointer"
                  >
                    <Compass className="h-5 w-5 text-orange-500" />
                    <span className="font-medium">Opportunities</span>
                    <ChevronRight className="h-4 w-4 ml-auto text-gray-400" />
                  </div>
                </motion.div>
                <motion.div custom={1} initial="hidden" animate="visible" variants={itemVariants}>
                  <div
                    onClick={() => { setTrendingOpen(true); setMobileMenuOpen(false); }}
                    className="flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-900 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700 cursor-pointer"
                  >
                    <Flame className="h-5 w-5 text-orange-500" />
                    <span className="font-medium">Trending</span>
                    <ChevronRight className="h-4 w-4 ml-auto text-gray-400" />
                  </div>
                </motion.div>
                <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-4 pt-4 pb-2">Pages</div>
                {navItems.map(({ path, icon: Icon, label }, i) => (
                  <motion.div
                    key={`${path}-${i}`}
                    custom={i + 2}
                    initial="hidden"
                    animate="visible"
                    variants={itemVariants}
                  >
                    <Link href={getHref(label)}>
                      <div
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-900 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700 cursor-pointer relative"
                      >
                        <Icon className="h-5 w-5" />
                        <span className="font-medium">{label}</span>
                        {label === "Chat" && unreadMessageCount > 0 && (
                          <span className="relative flex items-center justify-center ml-auto">
                            {unreadMessageCount > 0 && (
                              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-orange-400 opacity-75"></span>
                            )}
                            <span className="relative px-1.5 py-0.5 text-xs font-semibold bg-orange-500 text-white rounded-full min-w-[1.25rem] flex items-center justify-center">
                              {unreadMessageCount > 99 ? '99+' : unreadMessageCount}
                            </span>
                          </span>
                        )}
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
              <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                <div className="flex items-center space-x-3">
                  {/* <img
                    src={currentUser?.profile_image_url || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face"}
                    alt={currentUser?.username || 'User'}
                    className="w-10 h-10 rounded-full object-cover border-2 border-white dark:border-gray-700"
                  /> */}
                   <Avatar>
              <AvatarImage alt="user" src={
                currentUser?.profile_image_url ? getProfileImageSrc(currentUser.profile_image_url) : (userProfileImage?.image_url ? getProfileImageSrc(userProfileImage.image_url) : '/default.png')
              } 
              className="object-cover"
              />
              <AvatarFallback>{currentUser?.username?.[0]?.toUpperCase() || 'U'}</AvatarFallback>
            </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-800 dark:text-gray-100 truncate">
                      {currentUser?.username || 'User Profile'}
                    </p>
                    <div className="flex space-x-3 mt-1">
                          <div className="text-sm text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 cursor-pointer">
                            <ThemeToggle inline />
                          </div>
                      <div className="text-sm text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 cursor-pointer"
                        onClick={() =>{
toast.success("Logout successfully!")
                          logout()
                          setMobileMenuOpen(false)
                        } }
                      >
                        Logout
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        </>
      )}
    </AnimatePresence>

      {/* Opportunities Sheet - mobile */}
      <Sheet open={opportunitiesOpen} onOpenChange={setOpportunitiesOpen}>
        <SheetContent side="bottom" className="h-[90dvh] max-h-[90dvh] rounded-t-2xl p-0 flex flex-col">
          <SheetHeader className="p-4 border-b border-gray-200 dark:border-gray-700">
            <SheetTitle className="flex items-center gap-2">
              <Compass className="h-5 w-5 text-orange-500" />
              Opportunities
            </SheetTitle>
          </SheetHeader>
          <ScrollArea className="flex-1 p-4">
            {opportunitiesLoading ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3">
                <Loader className="h-8 w-8 animate-spin text-orange-500" />
                <span className="text-sm text-gray-500 dark:text-gray-400">Loading opportunities...</span>
              </div>
            ) : opportunities.length > 0 ? (
              <div className="space-y-3 pb-6">
                {opportunities.map((opp, index) => (
                  <div
                    key={opp.id}
                    className="p-3 border border-neutral-100 dark:border-gray-800 rounded-lg hover:bg-green-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                        index === 0 ? 'bg-gradient-to-r from-orange-400 to-orange-500 text-white' :
                        index === 1 ? 'bg-neutral-300 dark:bg-gray-700 text-neutral-700 dark:text-gray-300' :
                        'bg-neutral-200 dark:bg-gray-800 text-neutral-600 dark:text-gray-400'
                      }`}>
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 dark:text-gray-200 line-clamp-2">{opp.title}</p>
                        {opp.op_type && (
                          <span className="inline-block mt-1 px-2 py-0.5 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 rounded text-xs font-medium">{opp.op_type}</span>
                        )}
                        <p className="text-xs text-gray-600 dark:text-gray-300 mt-2 line-clamp-2">{opp.description}</p>
                        {opp.deadline && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Deadline: {new Date(opp.deadline).toLocaleDateString()}</p>
                        )}
                        {opp.link && (
                          <a href={opp.link} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-1 text-xs text-green-600 dark:text-green-400 font-medium">
                            <ExternalLink className="w-3 h-3" /> View / Apply
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center text-sm text-gray-500 dark:text-gray-400">No opportunities yet.</div>
            )}
          </ScrollArea>
        </SheetContent>
      </Sheet>

      {/* Trending Sheet - mobile */}
      <Sheet open={trendingOpen} onOpenChange={setTrendingOpen}>
        <SheetContent side="bottom" className="h-[90dvh] max-h-[90dvh] rounded-t-2xl p-0 flex flex-col">
          <SheetHeader className="p-4 border-b border-gray-200 dark:border-gray-700">
            <SheetTitle className="flex items-center gap-2">
              <Flame className="h-5 w-5 text-orange-500" />
              The International Brief
            </SheetTitle>
          </SheetHeader>
          <ScrollArea className="flex-1 p-4">
            {trendingLoading ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3">
                <Loader className="h-8 w-8 animate-spin text-orange-500" />
                <span className="text-sm text-gray-500 dark:text-gray-400">Loading news...</span>
              </div>
            ) : trendingNews.length > 0 ? (
              <div className="space-y-3 pb-6">
                {trendingNews.slice(0, 30).map((news, index) => {
                  const shortDesc = (news.description || news.content || '').replace(/\[\+?\d* chars\]/g, '').trim().slice(0, 100);
                  const categoryLabel = (news.category || '').charAt(0).toUpperCase() + (news.category || '').slice(1);
                  return (
                    <div
                      key={`${news.title}-${index}`}
                      className="p-3 border border-neutral-100 dark:border-gray-800 rounded-lg hover:bg-green-50 dark:hover:bg-gray-800 transition-colors"
                    >
                      <p className="text-sm font-medium text-gray-800 dark:text-gray-200 line-clamp-2">{news.title}</p>
                      {shortDesc && <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">{shortDesc}...</p>}
                      <span className="inline-block mt-2 px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded text-xs">{categoryLabel}</span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-12 text-center text-sm text-gray-500 dark:text-gray-400">No trending news available.</div>
            )}
          </ScrollArea>
        </SheetContent>
      </Sheet>

      <DialogDemo open={editProfileOpen} setOpen={setEditProfileOpen} />
    </>
  )

  function ProfileDropdown({ theme, toggleTheme, onLogout }) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button className="relative h-10 w-10 rounded-full p-0" variant="outline">
            <div className="flex flex-wrap gap-2 hover:cursor-pointer">
      {(["right"]).map((side) => (
        <Tooltip key={side} >
          <TooltipTrigger  asChild>
             <Avatar>
              <AvatarImage alt="user" src={
                currentUser?.profile_image_url ? getProfileImageSrc(currentUser.profile_image_url) : (userProfileImage?.image_url ? getProfileImageSrc(userProfileImage.image_url) : '/default.png')
              } 
              className="object-cover"
              />
              <AvatarFallback>{currentUser?.username?.[0]?.toUpperCase() || 'U'}</AvatarFallback>
            </Avatar>
          </TooltipTrigger>
          <TooltipContent side={side}>
            <p>Make it yours—add your details.</p>
            <p>BY creating your profile</p>
          </TooltipContent>
        </Tooltip>
      ))}
    </div>
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
            {theme === 'dark' ? <Sun /> : <Moon />}
            {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
            {/* <ThemeTogglerButton /> */}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setEditProfileOpen(true)}>
            <User className="mr-2 h-4 w-4" />
            Create Profile
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