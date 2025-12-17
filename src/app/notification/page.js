// app/notifications/page.js
'use client'

import { useState, useEffect } from 'react'
import { 
  Bell, 
  Search, 
  Archive, 
  Star, 
  StarOff, 
  Check, 
  CheckSquare, 
  Square,
  Filter,
  Clock,
  Calendar,
  MessageSquare,
  TrendingUp,
  Users,
  FileText,
  DollarSign,
  ThumbsUp,
  Mail
} from 'lucide-react'

export default function NotificationsPage() {
  const [darkMode, setDarkMode] = useState(true)
  const [activeFilter, setActiveFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      title: 'New Customer Registration',
      message: "We're pleased to inform you that a new customer has registered. Please follow up promptly by contacting.",
      time: 'Just Now',
      icon: 'users',
      read: false,
      favorite: true,
      category: 'customer'
    },
    {
      id: 2,
      title: 'Special Offer Announcement',
      message: 'Hello Sales Marketing Team, We have a special offer for our customers! Enjoy a 20% discount on selected...',
      time: '30 minutes ago',
      icon: 'trending',
      read: true,
      favorite: true,
      category: 'marketing'
    },
    {
      id: 3,
      title: 'Sales Target Reminder',
      message: "Hello Sales Marketing Team, This is a reminder to achieve this month's sales target. Currently, we've...",
      time: '2 days ago',
      icon: 'target',
      read: true,
      favorite: true,
      category: 'sales'
    },
    {
      id: 4,
      title: 'Product Information Request',
      message: 'Hello Sales Marketing Team, We have received a product information request from a potential customer.',
      time: '5 days ago',
      icon: 'message',
      read: true,
      favorite: true,
      category: 'lead'
    },
    {
      id: 5,
      title: 'Product Information Request',
      message: 'Hello Sales Marketing Team, We have received a product information request from a potential customer.',
      time: '07 Feb, 2024',
      icon: 'message',
      read: true,
      favorite: true,
      category: 'lead'
    },
    {
      id: 6,
      title: 'Meeting Scheduled',
      message: 'Hello Sales Marketing Team, A meeting or presentation has been scheduled with a customer/prospect.',
      time: '01 Feb, 2024',
      icon: 'calendar',
      read: true,
      favorite: false,
      category: 'meeting'
    },
    {
      id: 7,
      title: 'Contract Review Reminder',
      message: 'Hello Sales Marketing Team, This is a reminder to review the contract or proposal currently under...',
      time: '28 Jan, 2024',
      icon: 'file',
      read: true,
      favorite: false,
      category: 'document'
    },
    {
      id: 8,
      title: 'Customer Follow-up Required',
      message: "Hello Sales Marketing Team, It's time for a follow-up with a customer after their recent purchase/meeting.",
      time: '27 Jan, 2024',
      icon: 'followup',
      read: true,
      favorite: false,
      category: 'followup'
    },
    {
      id: 9,
      title: 'Positive Customer Feedback',
      message: 'Hello Sales Marketing Team, We have received positive feedback from a satisfied customer...',
      time: '26 Jan, 2024',
      icon: 'feedback',
      read: true,
      favorite: false,
      category: 'feedback'
    },
    {
      id: 10,
      title: 'Outstanding Payment Reminder',
      message: 'Hello Sales Marketing Team, This is a reminder regarding an outstanding payment from a customer...',
      time: '25 Jan, 2024',
      icon: 'payment',
      read: true,
      favorite: false,
      category: 'finance'
    }
  ])

  const filterOptions = [
    { id: 'all', label: 'All', count: 188 },
    { id: 'unread', label: 'Unread', count: 10 },
    { id: 'archived', label: 'Archived', count: 0 }
  ]

  const iconComponents = {
    users: Users,
    trending: TrendingUp,
    target: TrendingUp,
    message: MessageSquare,
    calendar: Calendar,
    file: FileText,
    followup: Clock,
    feedback: ThumbsUp,
    payment: DollarSign,
    mail: Mail
  }

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [darkMode])

  const toggleDarkMode = () => {
    setDarkMode(!darkMode)
  }

  const toggleReadStatus = (id) => {
    setNotifications(notifications.map(notification => 
      notification.id === id 
        ? { ...notification, read: !notification.read }
        : notification
    ))
  }

  const toggleFavorite = (id) => {
    setNotifications(notifications.map(notification => 
      notification.id === id 
        ? { ...notification, favorite: !notification.favorite }
        : notification
    ))
  }

  const markAllAsRead = () => {
    setNotifications(notifications.map(notification => ({
      ...notification,
      read: true
    })))
  }

  const filteredNotifications = notifications.filter(notification => {
    const matchesSearch = searchQuery === '' || 
      notification.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      notification.message.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesFilter = activeFilter === 'all' || 
      (activeFilter === 'unread' && !notification.read)
    
    return matchesSearch && matchesFilter
  })

  const unreadCount = notifications.filter(n => !n.read).length
  const favoriteCount = notifications.filter(n => n.favorite).length

  const getTimeColor = (time) => {
    if (time.includes('Now') || time.includes('minutes')) {
      return 'text-green-500'
    } else if (time.includes('days')) {
      return 'text-orange-500'
    }
    return darkMode ? 'text-gray-400' : 'text-gray-600'
  }

  const getCategoryColor = (category) => {
    const colors = {
      customer: 'bg-green-500/20 text-green-500',
      marketing: 'bg-orange-500/20 text-orange-500',
      sales: 'bg-green-500/20 text-green-500',
      lead: 'bg-orange-500/20 text-orange-500',
      meeting: 'bg-green-500/20 text-green-500',
      document: 'bg-orange-500/20 text-orange-500',
      followup: 'bg-green-500/20 text-green-500',
      feedback: 'bg-orange-500/20 text-orange-500',
      finance: 'bg-green-500/20 text-green-500'
    }
    return colors[category] || 'bg-gray-500/20 text-gray-500'
  }

  const getIconBgColor = (icon) => {
    const iconColors = {
      users: 'bg-green-500',
      trending: 'bg-orange-500',
      target: 'bg-green-500',
      message: 'bg-orange-500',
      calendar: 'bg-green-500',
      file: 'bg-orange-500',
      followup: 'bg-green-500',
      feedback: 'bg-orange-500',
      payment: 'bg-green-500',
      mail: 'bg-orange-500'
    }
    return iconColors[icon] || 'bg-gray-500'
  }

  return (
    <div className={`min-h-screen transition-colors mt-30 duration-300 ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Header */}
      <div className={`sticky top-0 z-10 ${darkMode ? 'bg-gray-900/95' : 'bg-gray-50/95'} backdrop-blur-sm border-b ${darkMode ? 'border-gray-800' : 'border-gray-200'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-xl ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-sm`}>
                <Bell className={darkMode ? 'text-green-500' : 'text-green-600'} size={24} />
              </div>
              <div>
                <h1 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  List Notification
                </h1>
                <p className={`mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Stay updated with all important alerts
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={markAllAsRead}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${darkMode ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
              >
                Mark all as read
              </button>
              <button
                onClick={toggleDarkMode}
                className={`p-2 rounded-lg transition-colors ${darkMode ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
              >
                {darkMode ? '☀️' : '🌙'}
              </button>
            </div>
          </div>
          
          {/* Stats */}
          <div className="mt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h2 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  188
                </h2>
                <span className={`text-lg ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Notifications
                </span>
              </div>
              <div className="flex items-center gap-1">
                <Star size={18} className="text-orange-500" />
                <span className={`font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  {favoriteCount} Favorites
                </span>
              </div>
            </div>
          </div>
          
          {/* Filter Tabs */}
          <div className="mt-6 flex flex-wrap gap-4">
            {filterOptions.map((filter) => (
              <button
                key={filter.id}
                onClick={() => setActiveFilter(filter.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-300 ${
                  activeFilter === filter.id
                    ? 'bg-green-500 text-white'
                    : darkMode
                    ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                <span className="font-medium">{filter.label}</span>
                <span className={`px-2 py-1 text-xs rounded-full ${
                  activeFilter === filter.id
                    ? 'bg-white/20'
                    : darkMode
                    ? 'bg-gray-700'
                    : 'bg-gray-300'
                }`}>
                  {filter.count}
                </span>
              </button>
            ))}
            
            <button className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              darkMode ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}>
              <Archive size={18} />
              <span className="font-medium">Archive</span>
            </button>
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search Bar */}
        <div className="mb-8">
          <div className="relative">
            <Search className={`absolute left-4 top-1/2 transform -translate-y-1/2 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} size={20} />
            <input
              type="text"
              placeholder="Search by Name Product"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full pl-12 pr-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-green-500 transition-all ${
                darkMode
                  ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500'
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
              }`}
            />
            <button className={`absolute right-3 top-1/2 transform -translate-y-1/2 p-2 rounded-lg transition-colors ${
              darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-200'
            }`}>
              <Filter size={18} className={darkMode ? 'text-gray-400' : 'text-gray-500'} />
            </button>
          </div>
        </div>
        
        {/* Favorites Section */}
        {filteredNotifications.filter(n => n.favorite).length > 0 && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Star className="text-orange-500" size={20} />
              <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Favorite
              </h3>
            </div>
            
            <div className="space-y-3">
              {filteredNotifications
                .filter(n => n.favorite)
                .map((notification) => (
                  <NotificationCard
                    key={notification.id}
                    notification={notification}
                    darkMode={darkMode}
                    toggleReadStatus={toggleReadStatus}
                    toggleFavorite={toggleFavorite}
                    getTimeColor={getTimeColor}
                    getCategoryColor={getCategoryColor}
                    getIconBgColor={getIconBgColor}
                    iconComponents={iconComponents}
                  />
                ))}
            </div>
          </div>
        )}
        
        {/* All Notifications */}
        <div>
          <h3 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            All Notifications
          </h3>
          
          {filteredNotifications.length === 0 ? (
            <div className={`text-center py-12 rounded-xl ${
              darkMode ? 'bg-gray-800/50' : 'bg-gray-100'
            }`}>
              <Bell className={`mx-auto ${darkMode ? 'text-gray-700' : 'text-gray-400'}`} size={48} />
              <p className={`mt-4 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                No notifications found
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredNotifications.map((notification) => (
                <NotificationCard
                  key={notification.id}
                  notification={notification}
                  darkMode={darkMode}
                  toggleReadStatus={toggleReadStatus}
                  toggleFavorite={toggleFavorite}
                  getTimeColor={getTimeColor}
                  getCategoryColor={getCategoryColor}
                  getIconBgColor={getIconBgColor}
                  iconComponents={iconComponents}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function NotificationCard({ 
  notification, 
  darkMode, 
  toggleReadStatus, 
  toggleFavorite, 
  getTimeColor, 
  getCategoryColor,
  getIconBgColor,
  iconComponents 
}) {
  const IconComponent = iconComponents[notification.icon] || Bell
  
  return (
    <div className={`group relative rounded-xl transition-all duration-300 hover:shadow-lg ${
      darkMode 
        ? notification.read 
          ? 'bg-gray-800/50 hover:bg-gray-800' 
          : 'bg-gray-800 border-l-4 border-green-500'
        : notification.read 
          ? 'bg-white hover:bg-gray-50' 
          : 'bg-white border-l-4 border-green-500'
    } ${!notification.read ? 'shadow-sm' : ''}`}>
      <div className="p-4">
        <div className="flex items-start gap-4">
          {/* Checkbox */}
          <button
            onClick={() => toggleReadStatus(notification.id)}
            className="mt-1 flex-shrink-0"
          >
            {notification.read ? (
              <CheckSquare className={darkMode ? 'text-gray-600' : 'text-gray-400'} size={20} />
            ) : (
              <Square className="text-green-500" size={20} />
            )}
          </button>
          
          {/* Icon */}
          <div className={`flex-shrink-0 w-10 h-10 rounded-lg ${getIconBgColor(notification.icon)} flex items-center justify-center`}>
            <IconComponent className="text-white" size={20} />
          </div>
          
          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h4 className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'} ${!notification.read ? 'font-semibold' : ''}`}>
                  {notification.title}
                </h4>
                <p className={`mt-1 text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  {notification.message}
                </p>
              </div>
              
              <div className="flex flex-col items-end gap-2 flex-shrink-0">
                <button
                  onClick={() => toggleFavorite(notification.id)}
                  className="p-1 rounded-md hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                >
                  {notification.favorite ? (
                    <Star className="text-orange-500" size={18} />
                  ) : (
                    <StarOff className={darkMode ? 'text-gray-500' : 'text-gray-400'} size={18} />
                  )}
                </button>
                
                <span className={`text-xs font-medium ${getTimeColor(notification.time)}`}>
                  {notification.time}
                </span>
                
                <span className={`px-2 py-1 text-xs rounded-full ${getCategoryColor(notification.category)}`}>
                  {notification.category}
                </span>
              </div>
            </div>
            
            {/* Actions */}
            <div className="flex items-center gap-4 mt-3 pt-3 border-t border-dashed border-gray-700/30 dark:border-gray-300/20">
              <button className={`text-sm font-medium transition-colors ${
                darkMode ? 'text-green-400 hover:text-green-300' : 'text-green-600 hover:text-green-700'
              }`}>
                Follow up
              </button>
              <button className={`text-sm font-medium transition-colors ${
                darkMode ? 'text-orange-400 hover:text-orange-300' : 'text-orange-600 hover:text-orange-700'
              }`}>
                View details
              </button>
              <button className={`text-sm font-medium transition-colors ${
                darkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-600 hover:text-gray-700'
              }`}>
                Archive
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Unread indicator */}
      {!notification.read && (
        <div className="absolute top-4 right-4">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
        </div>
      )}
    </div>
  )
}