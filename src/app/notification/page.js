"use client"

import { useState, useEffect, useRef } from "react"
import { Bell, Check, Trash2, X, AlertCircle, MessageSquare, Users, Info, ExternalLink } from "lucide-react"
import toast from "react-hot-toast"
import { io } from "socket.io-client"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useRouter } from "next/navigation"

const getNotificationIcon = (type) => {
  switch (type) {
    case "message":
      return MessageSquare
    case "system":
      return Info
    case "alert":
      return AlertCircle
    case "group_update":
      return Users
    default:
      return Bell
  }
}

const getNotificationColor = (type) => {
  switch (type) {
    case "message":
      return "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400"
    case "system":
      return "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400"
    case "alert":
      return "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"
    case "group_update":
      return "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
    default:
      return "bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-400"
  }
}
export default function NotificationPage() {
  const [notifications, setNotifications] = useState([])
  const [filteredNotifications, setFilteredNotifications] = useState([])
  const [sentNotifications, setSentNotifications] = useState([])
  const [filteredSentNotifications, setFilteredSentNotifications] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [unreadCount, setUnreadCount] = useState(0)
  const [filter, setFilter] = useState("all") // all, message, system, alert, group_update
  const [sentFilter, setSentFilter] = useState("all")
  const [viewMode, setViewMode] = useState("received") // received or sent
  const [isSendDialogOpen, setIsSendDialogOpen] = useState(false)
  const [isCrcOrSuperuser, setIsCrcOrSuperuser] = useState(false)
  const [currentUser, setCurrentUser] = useState(null)
  const [socket, setSocket] = useState(null)
  const router = useRouter()

  const [sendFormData, setSendFormData] = useState({
    recipient_ids: "all", // "all" or array of user IDs
    selectedUsers: [],
    type: "system",
    title: "",
    message: "",
    link: "",
  })

  const [users, setUsers] = useState([])
  const socketRef = useRef(null)

  useEffect(() => {
    // Get current user from localStorage
    const storedUser = localStorage.getItem("fullInfo")
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser)
        setCurrentUser(user)
        setIsCrcOrSuperuser(user.is_crc === true || user.is_superuser === true)
      } catch (e) {
        console.error("Error parsing user info:", e)
      }
    }
  }, [])

  useEffect(() => {
    if (currentUser?.id) {
      if (viewMode === "received") {
        fetchNotifications()
      } else {
        fetchSentNotifications()
      }
      
      // Initialize Socket.IO connection
      if (!socketRef.current && typeof window !== "undefined") {
        try {
          const socketInstance = io(process.env.NEXT_PUBLIC_SOCKET_URL || window.location.origin, {
            path: "/api/socketio",
            transports: ["websocket", "polling"],
          })

          socketInstance.on("connect", () => {
            console.log("Socket connected for notifications")
            socketInstance.emit("join_notifications", { userId: currentUser.id })
          })

          socketInstance.on("new_notification", (notification) => {
            setNotifications((prev) => [notification, ...prev])
            setUnreadCount((prev) => prev + 1)
            toast.success(notification.title)
          })

          socketInstance.on("notification_count_updated", ({ unreadCount: count }) => {
            setUnreadCount(count)
          })

          socketRef.current = socketInstance
          setSocket(socketInstance)
        } catch (error) {
          console.error("Error initializing socket:", error)
        }
      }
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect()
        socketRef.current = null
      }
    }
  }, [currentUser, viewMode])

  useEffect(() => {
    if (filter === "all") {
      setFilteredNotifications(notifications)
    } else {
      setFilteredNotifications(
        notifications.filter((n) => n.type === filter)
      )
    }
  }, [notifications, filter])

  useEffect(() => {
    if (sentFilter === "all") {
      setFilteredSentNotifications(sentNotifications)
    } else {
      setFilteredSentNotifications(
        sentNotifications.filter((n) => n.type === sentFilter)
      )
    }
  }, [sentNotifications, sentFilter])

  const fetchNotifications = async () => {
    if (!currentUser?.id) return

    setIsLoading(true)
    try {
      const response = await fetch(
        `/api/notifications?userId=${currentUser.id}&limit=100`
      )
      const data = await response.json()
      console.log("fetch notifications result ",data)

      if (data.success) {
        setNotifications(data.data || [])
        setUnreadCount(data.unreadCount || 0)
      } else {
        toast.error("Failed to load notifications")
      }
    } catch (error) {
      console.error("Error fetching notifications:", error)
      toast.error("Failed to load notifications")
    } finally {
      setIsLoading(false)
    }
  }

  const fetchSentNotifications = async () => {
    if (!currentUser?.id) return

    setIsLoading(true)
    try {
      const response = await fetch(
        `/api/notifications/sent?userId=${currentUser.id}&limit=100`
      )
      const data = await response.json()

      if (data.success) {
        setSentNotifications(data.data || [])
      } else {
        toast.error("Failed to load sent notifications")
      }
    } catch (error) {
      console.error("Error fetching sent notifications:", error)
      toast.error("Failed to load sent notifications")
    } finally {
      setIsLoading(false)
    }
  }

  const fetchUsers = async () => {
    try {
      const response = await fetch("/api/manage")
      const data = await response.json()
      setUsers(data || [])
    } catch (error) {
      console.error("Error fetching users:", error)
      toast.error("Failed to load users")
    }
  }

  const markAsRead = async (notificationId) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          is_read: true,
          userId: currentUser.id,
        }),
      })

      const data = await response.json()

      if (data.success) {
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === notificationId
              ? { ...n, is_read: true, read_at: new Date().toISOString() }
              : n
          )
        )
        setUnreadCount((prev) => Math.max(0, prev - 1))

        // Emit to socket if available
        if (socket) {
          socket.emit("mark_notification_read", {
            notificationId,
            userId: currentUser.id,
          })
        }
      }
    } catch (error) {
      console.error("Error marking notification as read:", error)
      toast.error("Failed to mark notification as read")
    }
  }

  const markAllAsRead = async () => {
    try {
      const unreadNotifications = notifications.filter((n) => !n.is_read)
      
      await Promise.all(
        unreadNotifications.map((n) =>
          fetch(`/api/notifications/${n.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              is_read: true,
              userId: currentUser.id,
            }),
          })
        )
      )

      setNotifications((prev) =>
        prev.map((n) => ({ ...n, is_read: true }))
      )
      setUnreadCount(0)
      toast.success("All notifications marked as read")
    } catch (error) {
      console.error("Error marking all as read:", error)
      toast.error("Failed to mark all as read")
    }
  }

  const deleteNotification = async (notificationId, isSent = false) => {
    try {
      const response = await fetch(
        `/api/notifications/${notificationId}?userId=${currentUser.id}&isSent=${isSent}`,
        {
          method: "DELETE",
        }
      )

      const data = await response.json()

      if (data.success) {
        if (isSent) {
          setSentNotifications((prev) => prev.filter((n) => n.id !== notificationId))
        } else {
          setNotifications((prev) => prev.filter((n) => n.id !== notificationId))
        }
        toast.success("Notification deleted")
      } else {
        toast.error("Failed to delete notification")
      }
    } catch (error) {
      console.error("Error deleting notification:", error)
      toast.error("Failed to delete notification")
    }
  }
const deleteAllNotifications = async () => {
  if (!currentUser?.id) return;
  try {
    const isSent = viewMode === "sent";
    const response = await fetch(
      `/api/notifications?userId=${currentUser.id}&all=true&sent=${isSent}`,
      { method: "DELETE" }
    );

    const data = await response.json();

    if (data.success) {
      if (isSent) {
        setSentNotifications([]);
      } else {
        setNotifications([]);
        setUnreadCount(0);
      }
      toast.success(data.message || "Notifications deleted");
    } else {
      toast.error(data.message || "Failed to delete notifications");
    }
  } catch (err) {
    console.error("Error deleting all notifications:", err);
    toast.error("Failed to delete notifications");
  }
};
  const handleSendNotification = async (e) => {
    e.preventDefault()

    if (!sendFormData.title || !sendFormData.message) {
      toast.error("Title and message are required")
      return
    }

    try {
      let recipientIds = sendFormData.recipient_ids

      // If sending to selected users, use their IDs
      if (recipientIds === "selected" && sendFormData.selectedUsers.length > 0) {
        recipientIds = sendFormData.selectedUsers
      }

      const response = await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipient_ids: recipientIds,
          sender_id: currentUser.id,
          type: sendFormData.type,
          title: sendFormData.title,
          message: sendFormData.message,
          link: sendFormData.link || null,
        }),
      })

      const data = await response.json()

      if (data.success) {
        toast.success(`Notification sent to ${data.data.length} user(s)`)
        setIsSendDialogOpen(false)
        setSendFormData({
          recipient_ids: "all",
          selectedUsers: [],
          type: "system",
          title: "",
          message: "",
          link: "",
        })
        fetchNotifications()
      } else {
        toast.error(data.message || "Failed to send notification")
      }
    } catch (error) {
      console.error("Error sending notification:", error)
      toast.error("Failed to send notification")
    }
  }

  const handleNotificationClick = (notification) => {
    if (!notification.is_read) {
      markAsRead(notification.id)
    }

    if (notification.link) {
      router.push(notification.link)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl mt-30 ">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2">
            <Bell className="h-8 w-8" />
            Notifications
            {viewMode === "received" && unreadCount > 0 && (
              <span className="ml-2 px-3 py-1 bg-red-500 text-white text-sm rounded-full">
                {unreadCount}
              </span>
            )}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {viewMode === "received" ? "Stay updated with your latest activities" : "Notifications you've sent"}
          </p>
        </div>

        <div className="flex gap-2">
          {viewMode === "received" && unreadCount > 0 && (
            <Button
              onClick={markAllAsRead}
              variant="outline"
              className="bg-white dark:bg-gray-800"
            >
              <Check className="h-4 w-4 mr-2" />
              Mark all as read
            </Button>
          )}
          {isCrcOrSuperuser && (
            <Button 
              onClick={() => {
                const confirmed =window.confirm("Are you sure you want to send a notification?")
                if (confirmed) {
                  setIsSendDialogOpen(true)
                  fetchUsers()
                }
              }}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <Bell className="h-4 w-4 mr-2" />
              Send Notification
            </Button>
          )}
          {isCrcOrSuperuser && (
            <div>
            <Button
              onClick={() => setViewMode(viewMode === "received" ? "sent" : "received")}
              className={viewMode === "sent" ? "bg-orange-500 hover:bg-orange-600 text-white" : "bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"}
            >
              <Bell className="h-4 w-4 mr-2" />
              {viewMode === "received" ? "My Sent Notifications" : "Received Notifications"}
            </Button>
            {viewMode!="received"&&(
              <Button
              className="ml-4 bg-orange-500 hover:bg-orange-600"
              onClick={()=>{
                if(window.confirm("Delete all sent notifications? This will permanently remove them from your history.")){
                  // console.log("Hello World!")
                  deleteAllNotifications()
                }
              }}
              >
                <Trash2/>
                 Delete All
              </Button>
            )}
            </div>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {["all", "message", "system", "alert", "group_update"].map((type) => (
          <Button
            key={type}
            variant={
              viewMode === "received"
                ? filter === type ? "default" : "outline"
                : sentFilter === type ? "default" : "outline"
            }
            onClick={() => {
              if (viewMode === "received") {
                setFilter(type)
              } else {
                setSentFilter(type)
              }
            }}
            className={`capitalize ${
              (viewMode === "received" ? filter === type : sentFilter === type)
                ? "bg-green-600 hover:bg-green-700 text-white"
                : "bg-white dark:bg-gray-800"
            }`}
          >
            {type.replace("_", " ")}
          </Button>
        ))}
      </div>

      {/* Notifications List */}
      {isLoading ? (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          Loading notifications...
        </div>
      ) : viewMode === "received" && filteredNotifications.length === 0 ? (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          <Bell className="h-16 w-16 mx-auto mb-4 opacity-50" />
          <p className="text-lg">No notifications found</p>
        </div>
      ) : viewMode === "sent" && filteredSentNotifications.length === 0 ? (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          <Bell className="h-16 w-16 mx-auto mb-4 opacity-50" />
          <p className="text-lg">No sent notifications found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {(viewMode === "received" ? filteredNotifications : filteredSentNotifications).map((notification) => {
            const Icon = getNotificationIcon(notification.type)
            const colorClass = getNotificationColor(notification.type)
            
            let displayName = ""
            if (viewMode === "received") {
              displayName = notification.sender_first_name
                ? notification.sender_rwandan_name
                  ? `${notification.sender_first_name} ${notification.sender_rwandan_name}`.trim()
                  : notification.sender_first_name
                : notification.sender_username || "System"
            } else {
              displayName = notification.recipient_first_name
                ? notification.recipient_rwandan_name
                  ? `${notification.recipient_first_name} ${notification.recipient_rwandan_name}`.trim()
                  : notification.recipient_first_name
                : notification.recipient_username || "Unknown"
            }

            return (
              <div
                key={notification.id}
                className={`p-4 rounded-lg border ${
                  viewMode === "sent" || notification.is_read
                    ? "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                    : "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800"
                } hover:shadow-md transition-shadow cursor-pointer`}
                onClick={() => {
                  if (viewMode === "received") {
                    handleNotificationClick(notification)
                  }
                }}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1">
                    <div
                      className={`p-2 rounded-full ${colorClass} flex-shrink-0`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-gray-800 dark:text-gray-200">
                          {notification.title}
                        </h3>
                        {viewMode === "received" && !notification.is_read && (
                          <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></span>
                        )}
                      </div>
                      <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">
                        {notification.message}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-500">
                        <span>{viewMode === "received" ? "From" : "To"}: {displayName}</span>
                        <span>
                          {new Date(notification.created_at).toLocaleString()}
                        </span>
                        {notification.link && (
                          <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
                            <ExternalLink className="h-3 w-3" />
                            View
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {viewMode === "received" && !notification.is_read && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          markAsRead(notification.id)
                        }}
                        className="h-8 w-8 p-0"
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        deleteNotification(notification.id, viewMode === "sent")
                      }}
                      className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Send Notification Dialog (for superusers) */}
      <Dialog open={isSendDialogOpen} onOpenChange={setIsSendDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-900">
          <DialogHeader>
            <DialogTitle className="text-gray-800 dark:text-gray-200">
              Send Notification
            </DialogTitle>
            <DialogDescription className="text-gray-600 dark:text-gray-400">
              Send a notification to users. Only superusers can send system notifications.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSendNotification}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="recipient_type" className="text-gray-700 dark:text-gray-300">
                  Send To
                </Label>
                <Select
                  value={sendFormData.recipient_ids}
                  onValueChange={(value) =>
                    setSendFormData({ ...sendFormData, recipient_ids: value })
                  }
                >
                  <SelectTrigger className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700">
                    <SelectItem value="all">All Users</SelectItem>
                    <SelectItem value="selected">Selected Users</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {sendFormData.recipient_ids === "selected" && (
                <div className="space-y-2">
                  <Label className="text-gray-700 dark:text-gray-300">
                    Select Users
                  </Label>
                  <div className="max-h-40 overflow-y-auto border rounded-md p-2 bg-white dark:bg-gray-800">
                    {users.map((user) => (
                      <label
                        key={user.id}
                        className="flex items-center gap-2 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={sendFormData.selectedUsers.includes(user.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSendFormData({
                                ...sendFormData,
                                selectedUsers: [
                                  ...sendFormData.selectedUsers,
                                  user.id,
                                ],
                              })
                            } else {
                              setSendFormData({
                                ...sendFormData,
                                selectedUsers: sendFormData.selectedUsers.filter(
                                  (id) => id !== user.id
                                ),
                              })
                            }
                          }}
                          className="rounded"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          {user.first_name} {user.rwandan_name || ""} (
                          {user.email})
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="type" className="text-gray-700 dark:text-gray-300">
                  Type
                </Label>
                <Select
                  value={sendFormData.type}
                  onValueChange={(value) =>
                    setSendFormData({ ...sendFormData, type: value })
                  }
                >
                  <SelectTrigger className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700">
                    <SelectItem value="system">System</SelectItem>
                    <SelectItem value="alert">Alert</SelectItem>
                    <SelectItem value="message">Message</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="title" className="text-gray-700 dark:text-gray-300">
                  Title *
                </Label>
                <Input
                  id="title"
                  required
                  value={sendFormData.title}
                  onChange={(e) =>
                    setSendFormData({ ...sendFormData, title: e.target.value })
                  }
                  placeholder="Notification title"
                  className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-200"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="message" className="text-gray-700 dark:text-gray-300">
                  Message *
                </Label>
                <Textarea
                  id="message"
                  required
                  value={sendFormData.message}
                  onChange={(e) =>
                    setSendFormData({ ...sendFormData, message: e.target.value })
                  }
                  placeholder="Notification message"
                  rows={4}
                  className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-200"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="link" className="text-gray-700 dark:text-gray-300">
                  Link (Optional)
                </Label>
                <Input
                  id="link"
                  type="url"
                  value={sendFormData.link}
                  onChange={(e) =>
                    setSendFormData({ ...sendFormData, link: e.target.value })
                  }
                  placeholder="https://example.com"
                  className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-200"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsSendDialogOpen(false)}
                className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-200"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                Send Notification
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
