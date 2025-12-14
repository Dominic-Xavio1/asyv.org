'use client'
import React, { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { Search, Send, Check, CheckCheck, Clock, MoreVertical, ChevronLeft, Menu, X } from "lucide-react"
// Mock Data
const chats = [
  {
    id: "1",
    name: "Jacquenetta Slowgrave",
    lastMessage: "Great! Looking forward to it. See you then!",
    time: "10 minutes",
    unread: true,
    status: "online"
  },
  {
    id: "2",
    name: "Nickola Peever",
    lastMessage: "Sounds perfect! I've been wanting to try that place.",
    time: "40 minutes",
    unread: false,
    status: "away"
  },
  {
    id: "3",
    name: "Farand Hume",
    lastMessage: "How about 7 PM at the new Italian place downtown?",
    time: "Yesterday",
    unread: false
  },
  {
    id: "4",
    name: "Ossie Peasey",
    lastMessage: "Hey Bonnie, yes, definitely! What time works for you?",
    time: "13 days",
    unread: true
  },
  {
    id: "5",
    name: "Hall Negri",
    lastMessage: "No worries at all! I'll grab a table and wait for you.",
    time: "2 days",
    unread: false,
    status: "online"
  },
  {
    id: "6",
    name: "Alex Johnson",
    lastMessage: "The project files are ready for review.",
    time: "1 hour",
    unread: true
  },
  {
    id: "7",
    name: "Maria Garcia",
    lastMessage: "Can we reschedule our meeting?",
    time: "5 hours",
    unread: false
  },
  {
    id: "8",
    name: "David Smith",
    lastMessage: "Meeting notes are updated in the shared drive.",
    time: "2 hours",
    unread: true
  },
  {
    id: "9",
    name: "Emma Wilson",
    lastMessage: "Thanks for your help yesterday!",
    time: "1 day",
    unread: false
  },
  {
    id: "10",
    name: "Robert Brown",
    lastMessage: "Can you review the proposal?",
    time: "3 days",
    unread: true
  }
]

const messages = [
  { id: "1", text: "Great! Looking forward to it. See you then!", time: "10:23 AM", sender: "Jacquenetta", isOwn: false, status: "read" },
  { id: "2", text: "I know how important this file is to you. You can trust me :)", time: "05:23 PM", sender: "You", isOwn: true, status: "read" },
  { id: "3", text: "The presentation is scheduled for Friday 3 PM.", time: "05:24 PM", sender: "Jacquenetta", isOwn: false, status: "delivered" },
  { id: "4", text: "Perfect! I'll prepare all the documents by Thursday.", time: "05:25 PM", sender: "You", isOwn: true, status: "sent" },
  { id: "5", text: "Shall we have a quick sync tomorrow morning?", time: "05:26 PM", sender: "Jacquenetta", isOwn: false, status: "delivered" },
  { id: "6", text: "Yes, 10 AM works perfectly for me.", time: "05:27 PM", sender: "You", isOwn: true, status: "read" },
  { id: "7", text: "Great! I'll send the calendar invite.", time: "05:28 PM", sender: "Jacquenetta", isOwn: false, status: "read" },
]

const onlineUsers = [
  { id: "1", name: "Hall Negri", status: "online" },
  { id: "2", name: "Sarah Miller", status: "online" },
  { id: "3", name: "Tom Wilson", status: "away" },
  { id: "4", name: "Lisa Chen", status: "online" },
  { id: "5", name: "Mike Brown", status: "online" },
  { id: "6", name: "Emma Davis", status: "online" },
  { id: "7", name: "James Wilson", status: "away" },
  { id: "8", name: "Sophia Taylor", status: "online" },
  { id: "9", name: "Daniel Lee", status: "online" },
  { id: "10", name: "Olivia Martinez", status: "online" },
]

export default function ChatUI() {
  const [activeChat, setActiveChat] = useState(chats[0])
  const [message, setMessage] = useState("")
  const [isMobile, setIsMobile] = useState(false)
  const [showChatList, setShowChatList] = useState(true)
  const [showChatView, setShowChatView] = useState(false)
  const [showOnlineUsers, setShowOnlineUsers] = useState(true)
  const [isDarkMode, setIsDarkMode] = useState(false)

  // Check screen size for responsive behavior
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024)
      if (window.innerWidth < 1024) {
        setShowChatView(false)
        setShowOnlineUsers(false)
      } else {
        setShowChatList(true)
        setShowChatView(true)
        setShowOnlineUsers(true)
      }
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Check for dark mode
  useEffect(() => {
    const checkDarkMode = () => {
      if (document.documentElement.classList.contains('dark')) {
        setIsDarkMode(true)
      } else {
        setIsDarkMode(false)
      }
    }
    
    checkDarkMode()
    // Watch for theme changes
    const observer = new MutationObserver(checkDarkMode)
    observer.observe(document.documentElement, { 
      attributes: true, 
      attributeFilter: ['class'] 
    })
    
    return () => observer.disconnect()
  }, [])

  const handleSendMessage = () => {
    if (message.trim()) {
      console.log("Sending message:", message)
      setMessage("")
    }
  }

  const handleSelectChat = (chat) => {
    setActiveChat(chat)
    if (isMobile) {
      setShowChatList(false)
      setShowChatView(true)
    }
  }

  const handleBackToChats = () => {
    if (isMobile) {
      setShowChatList(true)
      setShowChatView(false)
    }
  }

  const getInitials = (name) => {
    return name
      .split(" ")
      .map(part => part[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  const getStatusColor = (status, isDark = isDarkMode) => {
    switch (status) {
      case "online": return "bg-green-500"
      case "away": return "bg-orange-500"
      default: return isDark ? "bg-gray-600" : "bg-gray-400"
    }
  }

  const getStatusIndicator = (status) => {
    const color = getStatusColor(status)
    return <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 ${isDarkMode ? 'border-gray-900' : 'border-background'} ${color}`} />
  }

  const getMessageStatusIcon = (status) => {
    switch (status) {
      case "sent": return <Check className="w-3 h-3 text-muted-foreground" />
      case "delivered": return <CheckCheck className="w-3 h-3 text-muted-foreground" />
      case "read": return <CheckCheck className="w-3 h-3 text-green-500" />
      default: return null
    }
  }

  // Background color based on mode
  const getBackgroundColor = () => {
    return isDarkMode ? 'bg-gray-900' : 'bg-background'
  }

  // Card background based on mode
  const getCardBackground = () => {
    return isDarkMode ? 'bg-gray-800' : 'bg-card'
  }

  // Text color based on mode
  const getTextColor = () => {
    return isDarkMode ? 'text-gray-100' : 'text-foreground'
  }

  // Muted text color based on mode
  const getMutedTextColor = () => {
    return isDarkMode ? 'text-gray-400' : 'text-muted-foreground'
  }

  // Border color based on mode
  const getBorderColor = () => {
    return isDarkMode ? 'border-gray-700' : 'border-border'
  }

  return (
    <div className={`h-screen flex flex-col ${getBackgroundColor()}`}>
      {/* Mobile Header */}
      {isMobile && (
        <div className={`lg:hidden flex items-center justify-between p-4 border-b ${getBorderColor()} ${isDarkMode ? 'bg-gray-800' : 'bg-background'}`}>
          {showChatView ? (
            <>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleBackToChats}
                className="mr-2"
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <div className="flex items-center gap-2 flex-1">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className={`${isDarkMode ? 'bg-gray-700 text-gray-100' : 'bg-primary text-primary-foreground'}`}>
                    {getInitials(activeChat.name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h2 className={`font-semibold text-sm ${getTextColor()}`}>{activeChat.name}</h2>
                  <p className={`text-xs ${getMutedTextColor()}`}>
                    {activeChat.status === "online" ? "Online" : "Last seen recently"}
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-5 w-5" />
              </Button>
            </>
          ) : (
            <>
              <h1 className={`text-xl font-semibold ${getTextColor()}`}>Chats</h1>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowOnlineUsers(!showOnlineUsers)}
              >
                <Menu className="h-5 w-5" />
              </Button>
            </>
          )}
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden gap-4 p-0 lg:p-4">
        {/* Chat List - Always visible on desktop, conditional on mobile */}
          {(showOnlineUsers || !isMobile) && (
          <div className={`${isMobile ? 'absolute right-0 top-0 h-full w-64 z-50 shadow-xl' : 'w-64 flex-shrink-0 h-full ml-4'} ${isMobile && !showOnlineUsers ? 'hidden' : ''} ${getBackgroundColor()}`}>
            <Card className={`h-full flex flex-col shadow-sm ${getBorderColor()} ${getCardBackground()}`}>
              <CardHeader className={`flex flex-row items-center justify-between border-b ${getBorderColor()}`}>
                <CardTitle className={`text-lg font-semibold ${getTextColor()}`}>Online Users</CardTitle>
                {isMobile && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowOnlineUsers(false)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </CardHeader>
              
              <CardContent className="flex-1 p-0">
                <ScrollArea className="h-[calc(100vh-12rem)] lg:h-[calc(100vh-16rem)]">
                  <div className="space-y-3 p-4">
                    {onlineUsers.map((user) => (
                      <div key={user.id} className={`flex items-center gap-3 p-2 rounded-lg ${isDarkMode ? 'hover:bg-gray-700/50' : 'hover:bg-muted/50'}`}>
                        <div className="relative">
                          <Avatar className={`border-2 ${isDarkMode ? 'border-gray-800' : 'border-background'}`}>
                            <AvatarFallback className={`${isDarkMode ? 'bg-gray-700 text-gray-100' : 'bg-primary/10 text-primary'}`}>
                              {getInitials(user.name)}
                            </AvatarFallback>
                          </Avatar>
                          <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 ${isDarkMode ? 'border-gray-800' : 'border-background'} ${
                            user.status === "online" ? "bg-green-500" : "bg-orange-500"
                          }`} />
                        </div>
                        
                        <div className="flex-1">
                          <p className={`font-medium ${getTextColor()}`}>{user.name}</p>
                          <div className="flex items-center gap-1">
                            <span className={`w-2 h-2 rounded-full ${
                              user.status === "online" ? "bg-green-500" : "bg-orange-500"
                            }`} />
                            <span className={`text-xs ${getMutedTextColor()}`}>{user.status}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>

                <Separator className={`my-4 ${isDarkMode ? 'bg-gray-700' : ''}`} />
                
                {/* Statistics */}
                <div className="space-y-3 p-4">
                  <div className="flex items-center justify-between">
                    <span className={`text-sm ${getMutedTextColor()}`}>Active Chats</span>
                    <Badge className="bg-green-500 hover:bg-green-600">4</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={`text-sm ${getMutedTextColor()}`}>Unread Messages</span>
                    <Badge className="bg-orange-500 hover:bg-orange-600">3</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={`text-sm ${getMutedTextColor()}`}>Online Now</span>
                    <Badge variant="outline" className="text-green-500 border-green-500">
                      {onlineUsers.filter(u => u.status === "online").length}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
        {(showChatList || !isMobile) && (
          <div className={`${isMobile ? 'w-full' : 'w-full lg:w-80'} flex-shrink-0 h-full`}>
            <Card className={`h-full flex flex-col shadow-sm ${getBorderColor()} ${getCardBackground()}`}>
              <CardHeader className="pb-3">
                {!isMobile && <CardTitle className={`text-xl font-semibold ${getTextColor()}`}>Chats</CardTitle>}
                <div className="relative">
                  <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${getMutedTextColor()}`} />
                  <Input
                    placeholder="Search chats..."
                    className={`pl-10 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder:text-gray-400' : ''}`}
                  />
                </div>
              </CardHeader>
              
              <CardContent className="flex-1 p-0">
                <ScrollArea className="h-[calc(100vh-12rem)] lg:h-[calc(100vh-16rem)]">
                  <div className="space-y-1 p-2">
                    {chats.map((chat) => (
                      <div
                        key={chat.id}
                        className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                          activeChat.id === chat.id
                            ? isDarkMode ? "bg-gray-700" : "bg-muted"
                            : isDarkMode ? "hover:bg-gray-700/50" : "hover:bg-muted/50"
                        }`}
                        onClick={() => handleSelectChat(chat)}
                      >
                        <div className="relative">
                          <Avatar className={`border-2 ${isDarkMode ? 'border-gray-800' : 'border-background'}`}>
                            <AvatarFallback className={`${isDarkMode ? 'bg-gray-700 text-gray-100' : 'bg-primary/10 text-primary'}`}>
                              {getInitials(chat.name)}
                            </AvatarFallback>
                          </Avatar>
                          {chat.status && getStatusIndicator(chat.status)}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className={`font-medium truncate ${getTextColor()}`}>
                              {chat.name}
                            </span>
                            <span className={`text-xs ${getMutedTextColor()}`}>
                              {chat.time}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <p className={`text-sm truncate ${getMutedTextColor()}`}>
                              {chat.lastMessage}
                            </p>
                            {chat.unread && (
                              <Badge className="ml-auto bg-green-500 hover:bg-green-600">
                                1
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Chat View - Hidden on mobile when not selected */}
        {(showChatView || !isMobile) && (
          <div className={`${isMobile ? 'w-full' : 'flex-1'} flex flex-col h-full ${isMobile ? '' : 'ml-4'}`}>
            <Card className={`flex-1 flex flex-col shadow-sm h-full ${getBorderColor()} ${getCardBackground()}`}>
              {/* Chat Header - Desktop only, mobile has separate header */}
              {!isMobile && (
                <div className={`flex items-center justify-between p-4 border-b ${getBorderColor()}`}>
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Avatar className={`border-2 ${isDarkMode ? 'border-gray-800' : 'border-background'}`}>
                        <AvatarFallback className={`${isDarkMode ? 'bg-gray-700 text-gray-100' : 'bg-primary/10 text-primary'}`}>
                          {getInitials(activeChat.name)}
                        </AvatarFallback>
                      </Avatar>
                      {activeChat.status && getStatusIndicator(activeChat.status)}
                    </div>
                    <div>
                      <h2 className={`font-semibold ${getTextColor()}`}>{activeChat.name}</h2>
                      <p className={`text-sm ${getMutedTextColor()}`}>
                        {activeChat.status === "online" ? "Online" : "Last seen recently"}
                      </p>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon">
                    <MoreVertical className="h-5 w-5" />
                  </Button>
                </div>
              )}

              {/* Messages Area */}
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.isOwn ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[85%] lg:max-w-[70%] rounded-2xl px-4 py-3 ${
                          msg.isOwn
                            ? "bg-primary text-primary-foreground rounded-tr-none"
                            : isDarkMode 
                              ? "bg-gray-700 text-gray-100 rounded-tl-none"
                              : "bg-muted text-foreground rounded-tl-none"
                        }`}
                      >
                        <p className="text-sm">{msg.text}</p>
                        <div className={`flex items-center gap-1 mt-1 text-xs ${msg.isOwn ? "text-primary-foreground/80" : getMutedTextColor()}`}>
                          <Clock className="w-3 h-3" />
                          <span>{msg.time}</span>
                          {msg.isOwn && (
                            <span className="ml-2">
                              {getMessageStatusIcon(msg.status)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>

              {/* Message Input */}
              <div className={`p-4 border-t ${getBorderColor()}`}>
                <div className="flex gap-2">
                  <Textarea
                    placeholder="Enter message..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault()
                        handleSendMessage()
                      }
                    }}
                    className={`min-h-[60px] flex-1 resize-none ${isDarkMode ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder:text-gray-400' : ''}`}
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!message.trim()}
                    className="bg-orange-500 hover:bg-orange-600 text-white"
                  >
                    <Send className="w-5 h-5" />
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Online Users Sidebar - Always visible on desktop, togglable on mobile */}
      
      </div>
    </div>
  )
}